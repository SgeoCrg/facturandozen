const db = require('../models');

/**
 * Panel Superadmin - Gestión de tenants
 */

exports.getTenants = async (req, res) => {
  try {
    const tenants = await db.Tenant.findAll({
      include: [{
        model: db.Subscription,
        as: 'subscription'
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json({ tenants });
  } catch (error) {
    console.error('Error listando tenants:', error);
    res.status(500).json({ error: 'Error obteniendo tenants' });
  }
};

exports.getTenantDetail = async (req, res) => {
  try {
    const tenant = await db.Tenant.findByPk(req.params.id, {
      include: [
        { model: db.Subscription, as: 'subscription' },
        { model: db.User, as: 'users' }
      ]
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant no encontrado' });
    }

    // Stats del tenant
    const [invoiceCount, customerCount, productCount] = await Promise.all([
      db.Invoice.count({ where: { tenantId: tenant.id } }),
      db.Customer.count({ where: { tenantId: tenant.id } }),
      db.Product.count({ where: { tenantId: tenant.id } })
    ]);

    res.json({
      tenant,
      stats: {
        invoices: invoiceCount,
        customers: customerCount,
        products: productCount,
        users: tenant.users.length
      }
    });
  } catch (error) {
    console.error('Error obteniendo tenant:', error);
    res.status(500).json({ error: 'Error obteniendo tenant' });
  }
};

exports.updateTenantStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['trial', 'active', 'suspended', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    const tenant = await db.Tenant.findByPk(req.params.id);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant no encontrado' });
    }

    tenant.status = status;
    await tenant.save();

    res.json({ message: 'Estado actualizado', tenant });
  } catch (error) {
    console.error('Error actualizando tenant:', error);
    res.status(500).json({ error: 'Error actualizando tenant' });
  }
};

exports.updateSubscription = async (req, res) => {
  try {
    const { plan, priceMonthly, maxInvoices, status } = req.body;

    const subscription = await db.Subscription.findOne({
      where: { tenantId: req.params.id }
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Subscripción no encontrada' });
    }

    if (plan) subscription.plan = plan;
    if (priceMonthly !== undefined) subscription.priceMonthly = priceMonthly;
    if (maxInvoices !== undefined) subscription.maxInvoices = maxInvoices;
    if (status) subscription.status = status;

    // Si pasa de trial a active, establecer periodo
    if (status === 'active' && subscription.status === 'trial') {
      subscription.currentPeriodStart = new Date();
      subscription.currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }

    await subscription.save();

    res.json({ message: 'Subscripción actualizada', subscription });
  } catch (error) {
    console.error('Error actualizando subscripción:', error);
    res.status(500).json({ error: 'Error actualizando subscripción' });
  }
};

exports.getStats = async (req, res) => {
  try {
    const [
      totalTenants,
      activeTenants,
      trialTenants,
      suspendedTenants,
      totalInvoices,
      totalUsers
    ] = await Promise.all([
      db.Tenant.count(),
      db.Tenant.count({ where: { status: 'active' } }),
      db.Tenant.count({ where: { status: 'trial' } }),
      db.Tenant.count({ where: { status: 'suspended' } }),
      db.Invoice.count(),
      db.User.count({ where: { role: { [db.Sequelize.Op.ne]: 'superadmin' } } })
    ]);

    // Revenue estimado (solo activos con subscripción de pago)
    const activeSubscriptions = await db.Subscription.findAll({
      where: {
        status: 'active',
        priceMonthly: { [db.Sequelize.Op.gt]: 0 }
      }
    });

    const mrr = activeSubscriptions.reduce((sum, sub) => sum + parseFloat(sub.priceMonthly), 0);

    res.json({
      totalTenants,
      activeTenants,
      trialTenants,
      suspendedTenants,
      totalInvoices,
      totalUsers,
      mrr: mrr.toFixed(2)
    });
  } catch (error) {
    console.error('Error obteniendo stats:', error);
    res.status(500).json({ error: 'Error obteniendo estadísticas' });
  }
};

exports.deleteTenant = async (req, res) => {
  const transaction = await db.sequelize.transaction();

  try {
    const tenant = await db.Tenant.findByPk(req.params.id);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant no encontrado' });
    }

    // Eliminar en cascada (usuarios, clientes, productos, facturas)
    await db.User.destroy({ where: { tenantId: tenant.id }, transaction });
    await db.Customer.destroy({ where: { tenantId: tenant.id }, transaction });
    await db.Product.destroy({ where: { tenantId: tenant.id }, transaction });
    
    // Eliminar facturas y líneas
    const invoices = await db.Invoice.findAll({ where: { tenantId: tenant.id }, transaction });
    for (const invoice of invoices) {
      await db.InvoiceLine.destroy({ where: { invoiceId: invoice.id }, transaction });
    }
    await db.Invoice.destroy({ where: { tenantId: tenant.id }, transaction });

    await db.Subscription.destroy({ where: { tenantId: tenant.id }, transaction });
    await tenant.destroy({ transaction });

    await transaction.commit();

    res.json({ message: 'Tenant eliminado completamente' });
  } catch (error) {
    await transaction.rollback();
    console.error('Error eliminando tenant:', error);
    res.status(500).json({ error: 'Error eliminando tenant' });
  }
};

// ========== GESTIÓN DE USUARIOS (CRUD) ==========

/**
 * Listar todos los usuarios de todos los tenants
 */
exports.getAllUsers = async (req, res) => {
  try {
    const { tenantId, role, search } = req.query;
    
    const whereClause = {};
    if (tenantId) whereClause.tenantId = tenantId;
    if (role) whereClause.role = role;
    if (search) {
      whereClause[db.Sequelize.Op.or] = [
        { name: { [db.Sequelize.Op.iLike]: `%${search}%` } },
        { email: { [db.Sequelize.Op.iLike]: `%${search}%` } }
      ];
    }

    const users = await db.User.findAll({
      where: whereClause,
      include: [{
        model: db.Tenant,
        as: 'tenant',
        attributes: ['id', 'name', 'nif', 'email']
      }],
      attributes: ['id', 'name', 'email', 'role', 'createdAt', 'lastLoginAt', 'tenantId'],
      order: [['createdAt', 'DESC']]
    });

    res.json({ users });
  } catch (error) {
    console.error('Error listando usuarios:', error);
    res.status(500).json({ error: 'Error obteniendo usuarios' });
  }
};

/**
 * Obtener detalle de un usuario
 */
exports.getUserDetail = async (req, res) => {
  try {
    const user = await db.User.findByPk(req.params.id, {
      include: [{
        model: db.Tenant,
        as: 'tenant',
        attributes: ['id', 'name', 'nif', 'email', 'status']
      }],
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({ error: 'Error obteniendo usuario' });
  }
};

/**
 * Crear usuario en cualquier tenant
 */
exports.createUser = async (req, res) => {
  try {
    const { name, email, role = 'user', tenantId, password } = req.body;

    if (!name || !email || !tenantId) {
      return res.status(400).json({ error: 'Nombre, email y tenantId requeridos' });
    }

    // Verificar tenant existe
    const tenant = await db.Tenant.findByPk(tenantId);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant no encontrado' });
    }

    // Verificar email único
    const existingUser = await db.User.findOne({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email ya existe' });
    }

    // Validar rol
    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({ error: 'Rol inválido' });
    }

    // Hash password si se proporciona, sino generar temporal
    const bcrypt = require('bcryptjs');
    const crypto = require('crypto');
    
    let hashedPassword;
    let isTemporaryPassword = false;
    
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    } else {
      const tempPassword = crypto.randomBytes(8).toString('hex');
      hashedPassword = await bcrypt.hash(tempPassword, 10);
      isTemporaryPassword = true;
    }

    const user = await db.User.create({
      tenantId,
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      isTemporaryPassword
    });

    const createdUser = await db.User.findByPk(user.id, {
      include: [{
        model: db.Tenant,
        as: 'tenant',
        attributes: ['id', 'name', 'nif', 'email']
      }],
      attributes: { exclude: ['password'] }
    });

    res.status(201).json({ 
      message: 'Usuario creado correctamente',
      user: createdUser
    });
  } catch (error) {
    console.error('Error creando usuario:', error);
    res.status(500).json({ error: 'Error creando usuario' });
  }
};

/**
 * Actualizar usuario de cualquier tenant
 */
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, tenantId } = req.body;

    const user = await db.User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // No permitir cambiar el último admin de un tenant
    if (role && role !== user.role && user.role === 'admin') {
      const adminCount = await db.User.count({
        where: { 
          tenantId: user.tenantId, 
          role: 'admin' 
        }
      });

      if (adminCount <= 1) {
        return res.status(400).json({ 
          error: 'No puedes cambiar el rol del último administrador del tenant' 
        });
      }
    }

    // Validar tenant si se proporciona
    if (tenantId && tenantId !== user.tenantId) {
      const tenant = await db.Tenant.findByPk(tenantId);
      if (!tenant) {
        return res.status(404).json({ error: 'Tenant no encontrado' });
      }
    }

    // Verificar email único si cambia
    if (email && email.toLowerCase() !== user.email) {
      const existingUser = await db.User.findOne({
        where: { 
          email: email.toLowerCase(),
          id: { [db.Sequelize.Op.ne]: id }
        }
      });

      if (existingUser) {
        return res.status(400).json({ error: 'Email ya existe' });
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email.toLowerCase();
    if (role && ['admin', 'user'].includes(role)) updateData.role = role;
    if (tenantId) updateData.tenantId = tenantId;

    await user.update(updateData);

    const updatedUser = await db.User.findByPk(user.id, {
      include: [{
        model: db.Tenant,
        as: 'tenant',
        attributes: ['id', 'name', 'nif', 'email']
      }],
      attributes: { exclude: ['password'] }
    });

    res.json({ 
      message: 'Usuario actualizado correctamente',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    res.status(500).json({ error: 'Error actualizando usuario' });
  }
};

/**
 * Eliminar usuario
 */
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await db.User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // No permitir eliminar el último admin de un tenant
    if (user.role === 'admin') {
      const adminCount = await db.User.count({
        where: { 
          tenantId: user.tenantId, 
          role: 'admin' 
        }
      });

      if (adminCount <= 1) {
        return res.status(400).json({ 
          error: 'No puedes eliminar el último administrador del tenant' 
        });
      }
    }

    // No permitir eliminar superadmin
    if (user.role === 'superadmin') {
      return res.status(400).json({ 
        error: 'No se puede eliminar un superadministrador' 
      });
    }

    await user.destroy();

    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    res.status(500).json({ error: 'Error eliminando usuario' });
  }
};

/**
 * Resetear contraseña de usuario
 */
exports.resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password, sendEmail = false } = req.body;

    const user = await db.User.findByPk(id, {
      include: [{
        model: db.Tenant,
        as: 'tenant'
      }]
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const bcrypt = require('bcryptjs');
    const crypto = require('crypto');
    
    let newPassword;
    let hashedPassword;
    
    if (password) {
      newPassword = password;
      hashedPassword = await bcrypt.hash(password, 10);
    } else {
      // Generar contraseña temporal
      newPassword = crypto.randomBytes(8).toString('hex');
      hashedPassword = await bcrypt.hash(newPassword, 10);
    }

    await user.update({
      password: hashedPassword,
      isTemporaryPassword: !password
    });

    // Enviar email si se solicita
    if (sendEmail && user.tenant) {
      const EmailService = require('../services/EmailService');
      await EmailService.sendUserInvitation(user, user.tenant, newPassword);
    }

    res.json({ 
      message: 'Contraseña reseteada correctamente',
      password: password ? undefined : newPassword, // Solo mostrar si es temporal
      emailSent: sendEmail
    });
  } catch (error) {
    console.error('Error reseteando contraseña:', error);
    res.status(500).json({ error: 'Error reseteando contraseña' });
  }
};



