const jwt = require('jsonwebtoken');
const db = require('../models');
const cache = require('../utils/cache');
const logger = require('../utils/logger');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Intentar desde caché
    const cacheKey = cache.getUserKey(decoded.id);
    let user = cache.get(cacheKey);

    if (!user) {
      user = await db.User.findByPk(decoded.id, {
        include: [{
          model: db.Tenant,
          as: 'tenant',
          required: false
        }]
      });

      if (!user) {
        return res.status(403).json({ error: 'Usuario no encontrado' });
      }

      // Guardar en caché 10 minutos
      cache.set(cacheKey, user, 600);
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId,
      tenant: user.tenant
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      logger.warn('Token expirado', { error: error.message });
      return res.status(401).json({ error: 'Token expirado' });
    }
    if (error.name === 'JsonWebTokenError') {
      logger.warn('Token inválido');
      return res.status(403).json({ error: 'Token inválido' });
    }
    logger.error('Error autenticación', { error: error.message });
    return res.status(500).json({ error: 'Error autenticación' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'Permisos insuficientes' });
  }
  next();
};

const requireSuperadmin = (req, res, next) => {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'Solo superadministradores' });
  }
  next();
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Acceso denegado. Permisos insuficientes.',
        required: roles,
        current: req.user.role
      });
    }
    next();
  };
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireSuperadmin,
  requireRole
};
