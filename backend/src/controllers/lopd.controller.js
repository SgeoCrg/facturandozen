const LOPDService = require('../services/LOPDService');
const db = require('../models');
const logger = require('../utils/logger');
const { auditDataAccess } = require('../middleware/audit');

// ===== CONSENTIMIENTOS =====

exports.grantConsent = async (req, res) => {
  try {
    const { consentType, email, customerId } = req.body;
    const { tenantId, id: userId } = req.user;

    if (!consentType || !email) {
      return res.status(400).json({ error: 'Tipo de consentimiento y email requeridos' });
    }

    const consent = await LOPDService.grantConsent(tenantId, email, consentType, {
      userId,
      customerId,
      ipAddress: req.ip,
      userAgent: req.userAgent,
      source: 'settings'
    });

    res.json({
      success: true,
      message: 'Consentimiento otorgado correctamente',
      consent
    });
  } catch (error) {
    logger.error('Error granting consent', { error: error.message });
    res.status(500).json({ error: 'Error otorgando consentimiento' });
  }
};

exports.revokeConsent = async (req, res) => {
  try {
    const { consentType, email } = req.body;
    const { tenantId } = req.user;

    if (!consentType || !email) {
      return res.status(400).json({ error: 'Tipo de consentimiento y email requeridos' });
    }

    await LOPDService.revokeConsent(tenantId, email, consentType);

    res.json({
      success: true,
      message: 'Consentimiento revocado correctamente'
    });
  } catch (error) {
    logger.error('Error revoking consent', { error: error.message });
    res.status(500).json({ error: 'Error revocando consentimiento' });
  }
};

exports.getConsents = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { email } = req.query;

    const consents = await LOPDService.getConsents(tenantId, email);

    res.json({
      success: true,
      consents
    });
  } catch (error) {
    logger.error('Error getting consents', { error: error.message });
    res.status(500).json({ error: 'Error obteniendo consentimientos' });
  }
};

// ===== SOLICITUDES DE DERECHOS =====

exports.createDataRequest = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const {
      requestType,
      email,
      name,
      nif,
      description
    } = req.body;

    if (!requestType || !email) {
      return res.status(400).json({ error: 'Tipo de solicitud y email requeridos' });
    }

    const request = await LOPDService.createDataRequest(tenantId, {
      requestType,
      email,
      name,
      nif,
      description,
      ipAddress: req.ip,
      userAgent: req.userAgent
    });

    res.status(201).json({
      success: true,
      message: 'Solicitud creada. Se ha enviado un email de verificación.',
      request: {
        id: request.id,
        requestType: request.requestType,
        status: request.status
      }
    });
  } catch (error) {
    logger.error('Error creating data request', { error: error.message });
    res.status(500).json({ error: 'Error creando solicitud' });
  }
};

exports.verifyDataRequest = async (req, res) => {
  try {
    const { token } = req.params;

    const request = await LOPDService.verifyDataRequest(token);

    res.json({
      success: true,
      message: 'Solicitud verificada correctamente',
      request: {
        id: request.id,
        requestType: request.requestType,
        status: request.status
      }
    });
  } catch (error) {
    logger.error('Error verifying data request', { error: error.message });
    res.status(400).json({ error: error.message });
  }
};

exports.getDataRequests = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { status, requestType, page = 1, limit = 20 } = req.query;

    const where = { tenantId };
    if (status) where.status = status;
    if (requestType) where.requestType = requestType;

    const offset = (page - 1) * limit;

    const { count, rows: requests } = await db.DataRequest.findAndCountAll({
      where,
      include: [
        { model: db.User, as: 'assignedUser', attributes: ['name', 'email'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      requests,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    logger.error('Error getting data requests', { error: error.message });
    res.status(500).json({ error: 'Error obteniendo solicitudes' });
  }
};

exports.processDataRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, data, notes } = req.body;
    const { id: userId } = req.user;

    if (!action || !['complete', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Acción inválida' });
    }

    const request = await LOPDService.processDataRequest(id, userId, action, data);

    if (notes) {
      request.notes = notes;
      await request.save();
    }

    res.json({
      success: true,
      message: `Solicitud ${action === 'complete' ? 'completada' : 'rechazada'} correctamente`,
      request
    });
  } catch (error) {
    logger.error('Error processing data request', { error: error.message });
    res.status(500).json({ error: 'Error procesando solicitud' });
  }
};

// ===== POLÍTICAS DE PRIVACIDAD =====

exports.createPrivacyPolicy = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const policyData = req.body;

    const policy = await LOPDService.createPrivacyPolicy(tenantId, policyData);

    res.status(201).json({
      success: true,
      message: 'Política de privacidad creada correctamente',
      policy
    });
  } catch (error) {
    logger.error('Error creating privacy policy', { error: error.message });
    res.status(500).json({ error: 'Error creando política de privacidad' });
  }
};

exports.getPrivacyPolicy = async (req, res) => {
  try {
    const { tenantId } = req.user;

    const policy = await LOPDService.getActivePrivacyPolicy(tenantId);

    res.json({
      success: true,
      policy
    });
  } catch (error) {
    logger.error('Error getting privacy policy', { error: error.message });
    res.status(500).json({ error: 'Error obteniendo política de privacidad' });
  }
};

exports.getPrivacyPolicyHistory = async (req, res) => {
  try {
    const { tenantId } = req.user;

    const policies = await db.PrivacyPolicy.findAll({
      where: { tenantId },
      order: [['effectiveDate', 'DESC']]
    });

    res.json({
      success: true,
      policies
    });
  } catch (error) {
    logger.error('Error getting privacy policy history', { error: error.message });
    res.status(500).json({ error: 'Error obteniendo historial de políticas' });
  }
};

// ===== REPORTES Y AUDITORÍA =====

exports.getActivityReport = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { startDate, endDate, userId, action, riskLevel } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Fechas de inicio y fin requeridas' });
    }

    const filters = {};
    if (userId) filters.userId = userId;
    if (action) filters.action = action;
    if (riskLevel) filters.riskLevel = riskLevel;

    const activities = await LOPDService.getActivityReport(
      tenantId,
      new Date(startDate),
      new Date(endDate),
      filters
    );

    res.json({
      success: true,
      activities,
      total: activities.length
    });
  } catch (error) {
    logger.error('Error getting activity report', { error: error.message });
    res.status(500).json({ error: 'Error obteniendo reporte de actividad' });
  }
};

exports.getConsentReport = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Fechas de inicio y fin requeridas' });
    }

    const consents = await LOPDService.getConsentReport(
      tenantId,
      new Date(startDate),
      new Date(endDate)
    );

    res.json({
      success: true,
      consents,
      total: consents.length
    });
  } catch (error) {
    logger.error('Error getting consent report', { error: error.message });
    res.status(500).json({ error: 'Error obteniendo reporte de consentimientos' });
  }
};

// ===== DATOS DEL USUARIO =====

exports.getUserData = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: 'Email requerido' });
    }

    // Obtener todos los datos relacionados con el email
    const [user, customer, consents, invoices] = await Promise.all([
      db.User.findOne({ where: { tenantId, email: email.toLowerCase() } }),
      db.Customer.findOne({ where: { tenantId, email: email.toLowerCase() } }),
      LOPDService.getConsents(tenantId, email),
      db.Invoice.findAll({ 
        where: { 
          tenantId,
          [db.Sequelize.Op.or]: [
            { customerName: { [db.Sequelize.Op.iLike]: `%${email}%` } },
            { '$customer.email$': email.toLowerCase() }
          ]
        },
        include: [{ model: db.Customer, as: 'customer' }]
      })
    ]);

    const userData = {
      personal: user ? {
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      } : null,
      customer: customer ? {
        name: customer.name,
        nif: customer.nif,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        city: customer.city,
        postalCode: customer.postalCode,
        createdAt: customer.createdAt
      } : null,
      consents: consents.map(c => ({
        type: c.consentType,
        granted: c.granted,
        grantedAt: c.grantedAt,
        revokedAt: c.revokedAt,
        version: c.version
      })),
      invoices: invoices.map(i => ({
        id: i.id,
        number: i.fullNumber,
        date: i.date,
        total: i.total,
        status: i.status
      }))
    };

    res.json({
      success: true,
      data: userData
    });
  } catch (error) {
    logger.error('Error getting user data', { error: error.message });
    res.status(500).json({ error: 'Error obteniendo datos del usuario' });
  }
};

exports.deleteUserData = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { email, reason } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email requerido' });
    }

    // Verificar que existe una solicitud de supresión verificada
    const deletionRequest = await db.DataRequest.findOne({
      where: {
        tenantId,
        email: email.toLowerCase(),
        requestType: 'erasure',
        status: 'completed',
        verifiedAt: { [db.Sequelize.Op.ne]: null }
      }
    });

    if (!deletionRequest) {
      return res.status(400).json({ 
        error: 'No existe una solicitud de supresión verificada para este email' 
      });
    }

    // Eliminar datos personales
    await Promise.all([
      db.User.destroy({ where: { tenantId, email: email.toLowerCase() } }),
      db.Customer.destroy({ where: { tenantId, email: email.toLowerCase() } }),
      db.Consent.destroy({ where: { tenantId, email: email.toLowerCase() } })
    ]);

    // Anonimizar facturas (mantener datos fiscales)
    await db.Invoice.update(
      { 
        customerName: 'Cliente eliminado',
        customerAddress: null
      },
      { 
        where: { 
          tenantId,
          '$customer.email$': email.toLowerCase()
        },
        include: [{ model: db.Customer, as: 'customer' }]
      }
    );

    // Log de actividad crítica
    await LOPDService.logActivity(
      tenantId,
      req.user.id,
      'data_deletion',
      'user',
      null,
      { email, reason },
      'critical'
    );

    res.json({
      success: true,
      message: 'Datos eliminados correctamente'
    });
  } catch (error) {
    logger.error('Error deleting user data', { error: error.message });
    res.status(500).json({ error: 'Error eliminando datos del usuario' });
  }
};
