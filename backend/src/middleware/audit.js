const LOPDService = require('../services/LOPDService');
const logger = require('../utils/logger');

// Middleware para registrar actividades automáticamente
const auditMiddleware = (action, entityType = null, riskLevel = 'low') => {
  return async (req, res, next) => {
    try {
      // Ejecutar la función original
      await next();

      // Registrar actividad después de la ejecución exitosa
      if (req.user && req.user.tenantId) {
        const metadata = {
          method: req.method,
          url: req.originalUrl,
          ip: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent')
        };

        // Obtener ID de entidad si está disponible
        let entityId = null;
        if (req.params.id) {
          entityId = req.params.id;
        } else if (res.locals.createdEntity) {
          entityId = res.locals.createdEntity.id;
        }

        await LOPDService.logActivity(
          req.user.tenantId,
          req.user.id,
          action,
          entityType,
          entityId,
          metadata,
          riskLevel
        );
      }
    } catch (error) {
      // Registrar actividad de error
      if (req.user && req.user.tenantId) {
        await LOPDService.logActivity(
          req.user.tenantId,
          req.user.id,
          `${action}_error`,
          entityType,
          null,
          {
            error: error.message,
            method: req.method,
            url: req.originalUrl
          },
          'high'
        );
      }
      throw error;
    }
  };
};

// Middleware específico para diferentes acciones
const auditCreate = (entityType) => auditMiddleware('create', entityType, 'medium');
const auditUpdate = (entityType) => auditMiddleware('update', entityType, 'medium');
const auditDelete = (entityType) => auditMiddleware('delete', entityType, 'high');
const auditView = (entityType) => auditMiddleware('view', entityType, 'low');
const auditExport = (entityType) => auditMiddleware('export', entityType, 'high');
const auditLogin = () => auditMiddleware('login', 'user', 'medium');
const auditLogout = () => auditMiddleware('logout', 'user', 'low');

// Middleware para registrar acceso a datos personales
const auditDataAccess = (entityType) => {
  return async (req, res, next) => {
    try {
      await next();

      if (req.user && req.user.tenantId) {
        const metadata = {
          method: req.method,
          url: req.originalUrl,
          ip: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
          dataAccessed: entityType
        };

        await LOPDService.logActivity(
          req.user.tenantId,
          req.user.id,
          'data_access',
          entityType,
          req.params.id,
          metadata,
          'medium'
        );
      }
    } catch (error) {
      throw error;
    }
  };
};

// Middleware para verificar consentimientos
const requireConsent = (consentType) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.tenantId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      // Verificar si el usuario tiene el consentimiento requerido
      const consent = await LOPDService.getConsents(req.user.tenantId, req.user.email);
      const hasConsent = consent.some(c => 
        c.consentType === consentType && 
        c.granted && 
        !c.revokedAt
      );

      if (!hasConsent) {
        return res.status(403).json({ 
          error: 'Consentimiento requerido',
          consentType,
          message: 'Debe otorgar su consentimiento para esta acción'
        });
      }

      next();
    } catch (error) {
      logger.error('Error checking consent', { error: error.message });
      res.status(500).json({ error: 'Error verificando consentimiento' });
    }
  };
};

// Middleware para registrar IP y User Agent
const logRequestInfo = (req, res, next) => {
  req.ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  req.userAgent = req.get('User-Agent');
  next();
};

module.exports = {
  auditMiddleware,
  auditCreate,
  auditUpdate,
  auditDelete,
  auditView,
  auditExport,
  auditLogin,
  auditLogout,
  auditDataAccess,
  requireConsent,
  logRequestInfo
};
