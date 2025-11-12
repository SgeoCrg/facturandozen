/**
 * Middleware de validación de inputs
 */

const sanitizeHTML = (str) => {
  if (typeof str !== 'string') return str;
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sanitized = {};
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      sanitized[key] = sanitizeHTML(obj[key]);
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitized[key] = sanitizeObject(obj[key]);
    } else {
      sanitized[key] = obj[key];
    }
  }
  return sanitized;
};

/**
 * Sanitiza inputs para prevenir XSS
 */
const sanitizeInputs = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  next();
};

/**
 * Valida que un objeto tenga los campos requeridos
 */
const requireFields = (fields) => {
  return (req, res, next) => {
    const missing = [];
    
    for (const field of fields) {
      if (!req.body[field] && req.body[field] !== 0 && req.body[field] !== false) {
        missing.push(field);
      }
    }
    
    if (missing.length > 0) {
      return res.status(400).json({ 
        error: `Campos requeridos: ${missing.join(', ')}` 
      });
    }
    
    next();
  };
};

/**
 * Valida formato email
 */
const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * Valida límite de tamaño de string
 */
const maxLength = (field, max) => {
  return (req, res, next) => {
    if (req.body[field] && req.body[field].length > max) {
      return res.status(400).json({ 
        error: `${field} no puede exceder ${max} caracteres` 
      });
    }
    next();
  };
};

module.exports = {
  sanitizeInputs,
  requireFields,
  validateEmail,
  maxLength,
  sanitizeHTML
};



