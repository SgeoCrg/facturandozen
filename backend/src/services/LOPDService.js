const crypto = require('crypto');
const db = require('../models');
const logger = require('../utils/logger');
const EmailService = require('./EmailService');

class LOPDService {
  
  // ===== CONSENTIMIENTOS =====
  
  static async grantConsent(tenantId, email, consentType, options = {}) {
    try {
      const {
        userId = null,
        customerId = null,
        ipAddress = null,
        userAgent = null,
        source = 'api',
        version = '1.0'
      } = options;

      // Revocar consentimiento anterior si existe
      await this.revokeConsent(tenantId, email, consentType);

      const consent = await db.Consent.create({
        tenantId,
        userId,
        customerId,
        email: email.toLowerCase(),
        consentType,
        granted: true,
        grantedAt: new Date(),
        ipAddress,
        userAgent,
        source,
        version
      });

      // Log de actividad
      await this.logActivity(tenantId, userId, 'consent_granted', 'consent', consent.id, {
        email,
        consentType,
        source
      });

      logger.info('Consent granted', { tenantId, email, consentType });
      return consent;
    } catch (error) {
      logger.error('Error granting consent', { error: error.message });
      throw error;
    }
  }

  static async revokeConsent(tenantId, email, consentType) {
    try {
      const consent = await db.Consent.findOne({
        where: {
          tenantId,
          email: email.toLowerCase(),
          consentType,
          granted: true,
          revokedAt: null
        }
      });

      if (consent) {
        consent.granted = false;
        consent.revokedAt = new Date();
        await consent.save();

        // Log de actividad
        await this.logActivity(tenantId, null, 'consent_revoked', 'consent', consent.id, {
          email,
          consentType
        });

        logger.info('Consent revoked', { tenantId, email, consentType });
      }

      return consent;
    } catch (error) {
      logger.error('Error revoking consent', { error: error.message });
      throw error;
    }
  }

  static async getConsents(tenantId, email = null) {
    try {
      const where = { tenantId };
      if (email) {
        where.email = email.toLowerCase();
      }

      return await db.Consent.findAll({
        where,
        order: [['createdAt', 'DESC']]
      });
    } catch (error) {
      logger.error('Error getting consents', { error: error.message });
      throw error;
    }
  }

  // ===== SOLICITUDES DE DERECHOS =====

  static async createDataRequest(tenantId, requestData) {
    try {
      const {
        requestType,
        email,
        name,
        nif,
        description,
        ipAddress,
        userAgent
      } = requestData;

      // Generar token de verificación
      const verificationToken = crypto.randomBytes(32).toString('hex');

      const request = await db.DataRequest.create({
        tenantId,
        requestType,
        email: email.toLowerCase(),
        name,
        nif,
        description,
        verificationToken,
        ipAddress,
        userAgent,
        status: 'pending'
      });

      // Enviar email de verificación
      await this.sendVerificationEmail(request);

      // Log de actividad
      await this.logActivity(tenantId, null, 'data_request_created', 'data_request', request.id, {
        requestType,
        email
      }, 'medium');

      logger.info('Data request created', { tenantId, requestType, email });
      return request;
    } catch (error) {
      logger.error('Error creating data request', { error: error.message });
      throw error;
    }
  }

  static async verifyDataRequest(token) {
    try {
      const request = await db.DataRequest.findOne({
        where: { verificationToken: token }
      });

      if (!request) {
        throw new Error('Token de verificación inválido');
      }

      if (request.verifiedAt) {
        throw new Error('Solicitud ya verificada');
      }

      request.verifiedAt = new Date();
      request.status = 'in_progress';
      await request.save();

      // Log de actividad
      await this.logActivity(request.tenantId, null, 'data_request_verified', 'data_request', request.id, {
        requestType: request.requestType,
        email: request.email
      });

      logger.info('Data request verified', { requestId: request.id });
      return request;
    } catch (error) {
      logger.error('Error verifying data request', { error: error.message });
      throw error;
    }
  }

  static async processDataRequest(requestId, assignedTo, action, data = null) {
    try {
      const request = await db.DataRequest.findByPk(requestId);
      
      if (!request) {
        throw new Error('Solicitud no encontrada');
      }

      request.assignedTo = assignedTo;
      request.status = action === 'complete' ? 'completed' : 'rejected';
      request.completedAt = new Date();
      
      if (action === 'complete') {
        request.responseData = data;
      } else {
        request.rejectionReason = data?.reason || 'Solicitud rechazada';
      }

      await request.save();

      // Log de actividad
      await this.logActivity(request.tenantId, assignedTo, 'data_request_processed', 'data_request', request.id, {
        requestType: request.requestType,
        action,
        email: request.email
      }, 'high');

      logger.info('Data request processed', { requestId, action });
      return request;
    } catch (error) {
      logger.error('Error processing data request', { error: error.message });
      throw error;
    }
  }

  // ===== LOGS DE ACTIVIDAD =====

  static async logActivity(tenantId, userId, action, entityType = null, entityId = null, metadata = {}, riskLevel = 'low') {
    try {
      const log = await db.ActivityLog.create({
        tenantId,
        userId,
        action,
        entityType,
        entityId,
        description: this.getActionDescription(action, entityType, metadata),
        metadata,
        riskLevel
      });

      // Log crítico requiere notificación
      if (riskLevel === 'critical') {
        await this.notifyCriticalActivity(log);
      }

      return log;
    } catch (error) {
      logger.error('Error logging activity', { error: error.message });
      // No lanzar error para no interrumpir el flujo principal
    }
  }

  static getActionDescription(action, entityType, metadata) {
    const descriptions = {
      'consent_granted': `Consentimiento otorgado para ${metadata.consentType}`,
      'consent_revoked': `Consentimiento revocado para ${metadata.consentType}`,
      'data_request_created': `Solicitud de ${metadata.requestType} creada`,
      'data_request_verified': `Solicitud de ${metadata.requestType} verificada`,
      'data_request_processed': `Solicitud de ${metadata.requestType} procesada`,
      'login': 'Inicio de sesión',
      'logout': 'Cierre de sesión',
      'create': `Creación de ${entityType}`,
      'update': `Actualización de ${entityType}`,
      'delete': `Eliminación de ${entityType}`,
      'view': `Consulta de ${entityType}`,
      'export': `Exportación de ${entityType}`
    };

    return descriptions[action] || `Acción: ${action}`;
  }

  // ===== POLÍTICAS DE PRIVACIDAD =====

  static async createPrivacyPolicy(tenantId, policyData) {
    try {
      const {
        version,
        title,
        content,
        effectiveDate,
        language = 'es',
        dataController,
        purposes,
        legalBasis,
        retentionPeriod,
        thirdParties,
        rights,
        dpoContact
      } = policyData;

      // Desactivar políticas anteriores
      await db.PrivacyPolicy.update(
        { isActive: false },
        { where: { tenantId, isActive: true } }
      );

      const policy = await db.PrivacyPolicy.create({
        tenantId,
        version,
        title,
        content,
        effectiveDate,
        language,
        dataController,
        purposes,
        legalBasis,
        retentionPeriod,
        thirdParties,
        rights,
        dpoContact,
        isActive: true
      });

      // Log de actividad
      await this.logActivity(tenantId, null, 'privacy_policy_created', 'privacy_policy', policy.id, {
        version,
        title
      }, 'high');

      logger.info('Privacy policy created', { tenantId, version });
      return policy;
    } catch (error) {
      logger.error('Error creating privacy policy', { error: error.message });
      throw error;
    }
  }

  static async getActivePrivacyPolicy(tenantId) {
    try {
      return await db.PrivacyPolicy.findOne({
        where: { tenantId, isActive: true },
        order: [['effectiveDate', 'DESC']]
      });
    } catch (error) {
      logger.error('Error getting privacy policy', { error: error.message });
      throw error;
    }
  }

  // ===== UTILIDADES =====

  static async sendVerificationEmail(request) {
    try {
      const verificationUrl = `${process.env.FRONTEND_URL || 'https://facturandozen.com'}/lopd/verify/${request.verificationToken}`;
      
      await EmailService.sendTemplate('data-request-verification', request.email, {
        name: request.name || 'Estimado/a usuario/a',
        requestType: this.getRequestTypeLabel(request.requestType),
        verificationUrl,
        tenantName: 'Su empresa' // TODO: Obtener del tenant
      });

      logger.info('Verification email sent', { requestId: request.id });
    } catch (error) {
      logger.error('Error sending verification email', { error: error.message });
    }
  }

  static getRequestTypeLabel(requestType) {
    const labels = {
      'access': 'acceso a sus datos',
      'rectification': 'rectificación de datos',
      'erasure': 'supresión de datos',
      'portability': 'portabilidad de datos',
      'restriction': 'limitación del tratamiento',
      'objection': 'oposición al tratamiento'
    };
    return labels[requestType] || requestType;
  }

  static async notifyCriticalActivity(log) {
    try {
      // TODO: Implementar notificaciones críticas
      logger.warn('Critical activity detected', { 
        logId: log.id, 
        action: log.action, 
        tenantId: log.tenantId 
      });
    } catch (error) {
      logger.error('Error notifying critical activity', { error: error.message });
    }
  }

  // ===== REPORTES Y AUDITORÍA =====

  static async getActivityReport(tenantId, startDate, endDate, filters = {}) {
    try {
      const where = {
        tenantId,
        createdAt: {
          [db.Sequelize.Op.between]: [startDate, endDate]
        }
      };

      if (filters.userId) where.userId = filters.userId;
      if (filters.action) where.action = filters.action;
      if (filters.riskLevel) where.riskLevel = filters.riskLevel;

      return await db.ActivityLog.findAll({
        where,
        include: [
          { model: db.User, as: 'user', attributes: ['name', 'email'] }
        ],
        order: [['createdAt', 'DESC']]
      });
    } catch (error) {
      logger.error('Error getting activity report', { error: error.message });
      throw error;
    }
  }

  static async getConsentReport(tenantId, startDate, endDate) {
    try {
      return await db.Consent.findAll({
        where: {
          tenantId,
          createdAt: {
            [db.Sequelize.Op.between]: [startDate, endDate]
          }
        },
        order: [['createdAt', 'DESC']]
      });
    } catch (error) {
      logger.error('Error getting consent report', { error: error.message });
      throw error;
    }
  }
}

module.exports = LOPDService;
