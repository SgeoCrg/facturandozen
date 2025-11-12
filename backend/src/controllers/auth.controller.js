const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models');
const logger = require('../utils/logger');
const EmailService = require('../services/EmailService');
// const LOPDService = require('../services/LOPDService');
const crypto = require('crypto');

exports.register = async (req, res) => {
  try {
    const { companyName, nif, email, password, name, referralCode } = req.body;

    if (!companyName || !nif || !email || !password || !name) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    // Verificar duplicados
    const existingTenant = await db.Tenant.findOne({ where: { email } });
    if (existingTenant) {
      return res.status(400).json({ error: 'Email ya registrado' });
    }

    const existingNif = await db.Tenant.findOne({ where: { nif: nif.toUpperCase() } });
    if (existingNif) {
      return res.status(400).json({ error: 'NIF ya registrado' });
    }

    // Crear tenant
    const tenant = await db.Tenant.create({
      name: companyName,
      nif: nif.toUpperCase(),
      email: email.toLowerCase(),
      address: '',
      status: 'active'
    });

    // Crear subscription STARTER (plan básico)
    const subscription = await db.Subscription.create({
      tenantId: tenant.id,
      plan: 'starter',
      status: 'active',
      priceMonthly: 9,
      maxInvoices: 100
    });

    // Crear usuario admin
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await db.User.create({
      tenantId: tenant.id,
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'admin'
    });

    // Crear settings por defecto
    await db.Settings.create({
      tenantId: tenant.id,
      companyName,
      nif: nif.toUpperCase(),
      address: '',
      phone: '',
      email: email.toLowerCase(),
      website: '',
      logo: null,
      invoicePrefix: 'F',
      nextInvoiceNumber: 1,
      defaultIva: 21,
      verifactuEnabled: false
    });

    // Procesar código de referido si existe
    if (referralCode) {
      try {
        const AffiliateService = require('../services/AffiliateService');
        await AffiliateService.registerReferral(referralCode, tenant.id);
        logger.info('Referral registered', { 
          tenantId: tenant.id, 
          referralCode,
          email: email.toLowerCase() 
        });
      } catch (error) {
        logger.warn('Error registering referral', { 
          error: error.message, 
          referralCode,
          tenantId: tenant.id 
        });
        // No fallar el registro si hay error en referido
      }
    }

    // TODO: Otorgar consentimiento por defecto para procesamiento de datos
    // await LOPDService.grantConsent(tenant.id, email, 'data_processing', {
    //   userId: user.id,
    //   ipAddress: req.ip,
    //   userAgent: req.get('User-Agent'),
    //   source: 'registration'
    // }).catch(err => {
    //   logger.error('Error granting default consent', { error: err.message });
    // });

    // Enviar email bienvenida
    await EmailService.sendWelcome(user, tenant, { password }).catch(err => {
      logger.error('Error sending welcome email', { error: err.message });
    });

    // Generar JWT
    const token = jwt.sign(
      { id: user.id, tenantId: tenant.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    logger.info('User registered', { email: user.email, tenantId: tenant.id });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        nif: tenant.nif
      },
      subscription: {
        plan: subscription.plan,
        status: subscription.status,
        trialEndsAt: subscription.trialEndsAt
      }
    });
  } catch (error) {
    logger.error('Error in register', { error: error.message });
    res.status(500).json({ error: 'Error en el registro' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }

    const user = await db.User.findOne({
      where: { email: email.toLowerCase() },
      include: [
        {
          model: db.Tenant,
          as: 'tenant',
          include: [{
            model: db.Subscription,
            as: 'subscription'
          }]
        }
      ]
    });

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar si la cuenta está bloqueada
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingTime = Math.ceil((user.lockedUntil - new Date()) / 1000 / 60);
      return res.status(423).json({ 
        error: `Cuenta bloqueada. Intenta de nuevo en ${remainingTime} minutos.`,
        reason: 'account_locked'
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      // Incrementar intentos de login
      const loginAttempts = user.loginAttempts + 1;
      const lockUntil = loginAttempts >= 5 ? new Date(Date.now() + 30 * 60 * 1000) : null; // 30 min
      
      await user.update({
        loginAttempts,
        lockedUntil: lockUntil
      });

      logger.warn('Failed login attempt', { 
        email: user.email, 
        attempts: loginAttempts,
        ip: req.ip 
      });

      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Resetear intentos de login en login exitoso
    await user.update({
      loginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date()
    });

    // Verificar tenant no suspendido (solo si tiene tenant)
    if (user.tenant && user.tenant.status === 'suspended') {
      return res.status(403).json({ 
        error: 'Cuenta suspendida. Contacta soporte.',
        reason: 'trial_expired'
      });
    }

    const token = jwt.sign(
      { id: user.id, tenantId: user.tenantId, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    logger.info('User logged in', { email: user.email, tenantId: user.tenantId });

    // Registrar actividad de login
    if (user.tenantId) {
      await db.ActivityLog.create({
        tenantId: user.tenantId,
        userId: user.id,
        action: 'login',
        details: {
          ip: req.ip,
          userAgent: req.get('User-Agent')
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }).catch(err => {
        logger.error('Error logging login activity', { error: err.message });
      });
    }

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isTemporaryPassword: user.isTemporaryPassword
      },
      tenant: user.tenant ? {
        id: user.tenant.id,
        name: user.tenant.name,
        nif: user.tenant.nif,
        status: user.tenant.status
      } : null,
      subscription: user.tenant?.subscription || null
    });
  } catch (error) {
    logger.error('Error in login', { error: error.message });
    res.status(500).json({ error: 'Error en el login' });
  }
};

exports.me = async (req, res) => {
  try {
    const user = await db.User.findByPk(req.user.id, {
      include: [
        {
          model: db.Tenant,
          as: 'tenant',
          include: [{
            model: db.Subscription,
            as: 'subscription'
          }]
        }
      ]
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      tenant: user.tenant ? {
        id: user.tenant.id,
        name: user.tenant.name,
        nif: user.tenant.nif,
        status: user.tenant.status
      } : null,
      subscription: user.tenant?.subscription || null
    });
  } catch (error) {
    logger.error('Error in me', { error: error.message });
    res.status(500).json({ error: 'Error obteniendo usuario' });
  }
};

// NUEVO: Solicitar recuperación de contraseña
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email requerido' });
    }

    const user = await db.User.findOne({
      where: { email: email.toLowerCase() }
    });

    // Por seguridad, siempre responder OK aunque no exista
    if (!user) {
      logger.warn('Password reset requested for non-existent email', { email });
      return res.json({ message: 'Si el email existe, recibirás instrucciones' });
    }

    // Generar token temporal (válido 1 hora)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    // Guardar en DB
    await user.update({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpires: resetTokenExpires
    });

    // Enviar email
    await EmailService.sendPasswordReset(user, resetToken);

    logger.info('Password reset requested', { email: user.email, userId: user.id });

    res.json({ message: 'Si el email existe, recibirás instrucciones' });
  } catch (error) {
    logger.error('Error in forgotPassword', { error: error.message });
    res.status(500).json({ error: 'Error procesando solicitud' });
  }
};

// NUEVO: Resetear contraseña
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token y contraseña requeridos' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Contraseña debe tener mínimo 6 caracteres' });
    }

    // Hash del token para buscar
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await db.User.findOne({
      where: {
        resetPasswordToken: resetTokenHash,
        resetPasswordExpires: {
          [db.Sequelize.Op.gt]: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({ error: 'Token inválido o expirado' });
    }

    // Actualizar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);
    await user.update({
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null
    });

    logger.info('Password reset successful', { userId: user.id });

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    logger.error('Error in resetPassword', { error: error.message });
    res.status(500).json({ error: 'Error reseteando contraseña' });
  }
};
