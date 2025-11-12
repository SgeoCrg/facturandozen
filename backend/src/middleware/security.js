/**
 * Middleware de seguridad adicional
 */

const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

/**
 * Rate limiting específico para endpoints críticos
 */
const createStrictLimiter = (windowMs = 15 * 60 * 1000, max = 10) => {
  return rateLimit({
    windowMs,
    max,
    message: 'Demasiadas peticiones. Intenta más tarde.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.url,
        method: req.method
      });
      res.status(429).json({
        error: 'Demasiadas peticiones. Intenta más tarde.',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
  });
};

/**
 * Validación de entrada contra ataques comunes
 */
const validateInput = (req, res, next) => {
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /eval\s*\(/i,
    /expression\s*\(/i,
    /vbscript:/i,
    /data:text\/html/i,
    /\.\.\//g, // Path traversal
    /union\s+select/i,
    /drop\s+table/i,
    /insert\s+into/i,
    /delete\s+from/i
  ];

  const checkValue = (value) => {
    if (typeof value === 'string') {
      return suspiciousPatterns.some(pattern => pattern.test(value));
    }
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(checkValue);
    }
    return false;
  };

  const hasSuspiciousContent = checkValue(req.body) || checkValue(req.query) || checkValue(req.params);

  if (hasSuspiciousContent) {
    logger.warn('Suspicious input detected', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
      method: req.method,
      body: req.body,
      query: req.query,
      params: req.params
    });
    
    return res.status(400).json({
      error: 'Contenido sospechoso detectado'
    });
  }

  next();
};

/**
 * Validación de headers de seguridad
 */
const validateHeaders = (req, res, next) => {
  const requiredHeaders = {
    'user-agent': req.get('User-Agent'),
    'accept': req.get('Accept')
  };

  // Verificar que no sea un bot malicioso
  const userAgent = req.get('User-Agent') || '';
  const suspiciousUserAgents = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java/i,
    /php/i
  ];

  const isSuspiciousUA = suspiciousUserAgents.some(pattern => pattern.test(userAgent));
  
  // Permitir curl en desarrollo para testing
  const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
  const isLocalhost = req.ip === '::1' || req.ip === '127.0.0.1' || req.ip.startsWith('::ffff:127.0.0.1');
  // Permitir si viene desde dentro de Docker o localhost
  const isInternalRequest = isLocalhost || req.ip.startsWith('172.') || req.ip.startsWith('192.168.');
  
  if (isSuspiciousUA && !userAgent.includes('Mozilla') && !(isDevelopment && isInternalRequest)) {
    // Solo bloquear si NO es request interno/desarrollo
    const shouldBlock = !isInternalRequest && process.env.NODE_ENV === 'production';
    
    if (shouldBlock) {
      logger.warn('Suspicious user agent', {
        ip: req.ip,
        userAgent,
        url: req.url,
        method: req.method
      });
      
      return res.status(403).json({
        error: 'Acceso denegado'
      });
    }
  }

  next();
};

/**
 * Middleware para prevenir ataques de fuerza bruta en login
 */
const loginLimiter = createStrictLimiter(15 * 60 * 1000, 5); // 5 intentos en 15 min

/**
 * Middleware para prevenir ataques de fuerza bruta en registro
 */
const registerLimiter = createStrictLimiter(60 * 60 * 1000, 3); // 3 registros por hora

/**
 * Middleware para endpoints de recuperación de contraseña
 */
const passwordResetLimiter = createStrictLimiter(60 * 60 * 1000, 3); // 3 intentos por hora

module.exports = {
  createStrictLimiter,
  validateInput,
  validateHeaders,
  loginLimiter,
  registerLimiter,
  passwordResetLimiter
};
