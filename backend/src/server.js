require('dotenv').config();

// Validación de variables de entorno (DEBE SER PRIMERO)
const { validateEnv } = require('./utils/env-validator');
validateEnv();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const db = require('./models');
const monitoring = require('./services/MonitoringService');

// Inicializar cron jobs Verifactu
require('./cron/verifactu-cron');

const app = express();

// Trust proxy - Necesario cuando está detrás de Nginx
// Configurado como 1 para permitir solo el primer proxy (Nginx)
app.set('trust proxy', 1);

// Sentry request handler (debe ser primero)
app.use(monitoring.requestHandler());

// Security - Activado en producción
if (process.env.NODE_ENV === 'production') {
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
        styleSrcElem: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net", "data:", "https:"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https://api.stripe.com", process.env.FRONTEND_URL || "https://facturandozen.com"],
        frameSrc: ["'self'", "https://js.stripe.com"]
      }
    }
  }));
}
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? (process.env.FRONTEND_URL || 'https://facturandozen.com')
    : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Demasiadas peticiones',
  standardHeaders: true,
  legacyHeaders: false,
  // Configurar keyGenerator para usar IP real cuando hay proxy
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress;
  }
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Input sanitization (XSS protection)
app.use(require('./middleware/validation').sanitizeInputs);

// Security middleware adicional
const { validateHeaders, validateInput } = require('./middleware/security');
// Excluir /health del middleware de seguridad (para healthchecks de Docker)
app.use((req, res, next) => {
  if (req.path === '/health') {
    return next();
  }
  validateHeaders(req, res, next);
});
app.use((req, res, next) => {
  if (req.path === '/health') {
    return next();
  }
  validateInput(req, res, next);
});

// Request logging
app.use(require('./middleware/requestLogger'));

// Swagger API Documentation
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Facturando Zen API Documentation'
}));

// Routes - API v1 (versionada)
app.use('/api/v1', require('./routes/v1/index'));

// Routes legacy (mantener compatibilidad hacia atrás - deprecar en v2)
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/superadmin', require('./routes/superadmin.routes'));
app.use('/api/verifactu', require('./routes/verifactu.routes'));
app.use('/api/stats', require('./routes/stats.routes'));
app.use('/api/customers', require('./routes/customer.routes'));
app.use('/api/products', require('./routes/product.routes'));
app.use('/api/invoices', require('./routes/invoice.routes'));
app.use('/api/settings', require('./routes/settings.routes'));
app.use('/api/billing', require('./routes/billing.routes'));
app.use('/api/lopd', require('./routes/lopd.routes'));
app.use('/api/affiliates', require('./routes/affiliate.routes'));
app.use('/api/public', require('./routes/public.routes'));

// Health check básico (sin información sensible)
app.get('/health', async (req, res) => {
  try {
    const metrics = await monitoring.getHealthMetrics();
    const statusCode = metrics.status === 'healthy' ? 200 : 503;
    
    // Solo información básica de estado
    res.status(statusCode).json({
      status: metrics.status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  } catch (error) {
    monitoring.captureException(error, { tags: { endpoint: 'health' } });
    res.status(500).json({ status: 'error', message: 'Service unavailable' });
  }
});

// Metrics endpoint protegido con autenticación básica
app.get('/metrics', (req, res, next) => {
  const auth = req.headers.authorization;
  
  if (!auth || !auth.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Metrics"');
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const credentials = Buffer.from(auth.slice(6), 'base64').toString();
  const [username, password] = credentials.split(':');
  
  const validUsername = process.env.METRICS_USERNAME || 'admin';
  const validPassword = process.env.METRICS_PASSWORD || 'metrics123';
  
  if (username !== validUsername || password !== validPassword) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  next();
}, async (req, res) => {
  try {
    const metrics = await monitoring.getHealthMetrics();
    
    // Stats adicionales
    const db = require('./models');
    const [tenants, invoices, users] = await Promise.all([
      db.Tenant.count(),
      db.Invoice.count(),
      db.User.count()
    ]);

    metrics.stats = {
      tenants,
      invoices,
      users
    };

    res.json(metrics);
  } catch (error) {
    monitoring.captureException(error, { tags: { endpoint: 'metrics' } });
    res.status(500).json({ error: 'Error getting metrics' });
  }
});

// Sentry error handler (debe ser antes del error handler custom)
app.use(monitoring.errorHandler());

// Error handling
app.use((err, req, res, next) => {
  const logger = require('./utils/logger');
  
  // Capturar en Sentry
  monitoring.captureException(err, {
    user: req.user,
    request: {
      url: req.url,
      method: req.method,
      headers: req.headers
    },
    extra: {
      body: req.body,
      query: req.query
    }
  });
  
  logger.error('Unhandled error', { 
    error: err.message, 
    stack: err.stack,
    url: req.url,
    method: req.method,
    user: req.user?.id
  });
  
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Error interno del servidor' 
      : err.message
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    await db.sequelize.authenticate();
    console.log('✅ Conexión DB establecida');
    
    // Sync models (development only)
    if (process.env.NODE_ENV === 'development') {
      await db.sequelize.sync();
      console.log('✅ Modelos sincronizados');
    }

    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Error iniciando servidor:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
