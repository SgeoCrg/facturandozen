/**
 * screenplay de validación de variables de entorno
 * Falla al inicio si falta algo crítico
 */

const logger = require('./logger');

const REQUIRED_VARS = {
  production: [
    'DB_HOST',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD',
    'JWT_SECRET',
    'NODE_ENV',
    'FRONTEND_URL'
  ],
  development: [
    'DATABASE_URL',
    'JWT_SECRET',
    'NODE_ENV'
  ]
};

const CRITICAL_WARNINGS = {
  production: [
    { var: 'SENDGRID_API_KEY', message: 'Email no funcionará sin SendGrid API Key' },
    { var: 'STRIPE_SECRET_KEY', message: 'Pagos no funcionarán sin Stripe keys' },
    { var: 'SENTRY_DSN', message: 'No habrá error tracking sin Sentry DSN' },
    { var: 'REDIS_HOST', message: 'Cache puede no funcionar sin Redis' }
  ]
};

const validateEnv = () => {
  const env = process.env.NODE_ENV || 'development';
  const required = REQUIRED_VARS[env] || REQUIRED_VARS.development;
  const missing = [];
  const warnings = [];

  // Validar requeridas
  required.forEach(varName => {
    if (!process.env[varName] || process.env[varName].includes('CHANGE_THIS') || process.env[varName].includes('TU_')) {
      missing.push(varName);
    }
  });

  // Warnings en producción
  if (env === 'production') {
    CRITICAL_WARNINGS.production.forEach(({ var: varName, message }) => {
      if (!process.env[varName] || process.env[varName].includes('CHANGE_THIS') || process.env[varName].includes('TU_')) {
        warnings.push(message);
      }
    });
  }

  // Validar JWT_SECRET fuerza
  if (process.env.JWT_SECRET) {
    if (process.env.JWT_SECRET.length < 32) {
      missing.push('JWT_SECRET (debe tener al menos 32 caracteres)');
    }
  }

  // Validar DB_PASSWORD fuerza en producción
  if (env === 'production' && process.env.DB_PASSWORD) {
    if (process.env.DB_PASSWORD.length < 16) {
      warnings.push('DB_PASSWORD debería tener al menos 16 caracteres en producción');
    }
  }

  // Fallar si falta algo crítico
  if (missing.length > 0) {
    logger.error('❌ VARIABLES DE ENTORNO CRÍTICAS FALTANTES:');
    missing.forEach(varName => {
      logger.error(`  - ${varName}`);
    });
    logger.error('\nEl servidor NO puede iniciar sin estas variables.\n');
    process.exit(1);
  }

  // Warning si falta algo importante (pero no crítico)
  if (warnings.length > 0) {
    logger.warn('⚠️  ADVERTENCIAS DE CONFIGURACIÓN:');
    warnings.forEach(msg => {
      logger.warn(`  - ${msg}`);
    });
  } else {
    logger.info('✅ Validación de variables de entorno: OK');
  }
};

module.exports = { validateEnv };

