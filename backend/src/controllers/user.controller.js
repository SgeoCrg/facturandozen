const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../models');
const logger = require('../utils/logger');
const EmailService = require('../services/EmailService');

// ========== GESTIÓN DE USUARIOS ==========

// Listar usuarios del tenant
exports.getUsers = async (req, res) => {
  try {
    const users = await db.User.findAll({
      where: { tenantId: req.user.tenantId },
      attributes: ['id', 'name', 'email', 'role', 'createdAt', 'lastLoginAt'],
      order: [['createdAt', 'DESC']]
    });

    res.json(users);
  } catch (error) {
    logger.error('Error getting users', { error: error.message });
    res.status(500).json({ error: 'Error obteniendo usuarios' });
  }
};

// Crear usuario (solo admin)
exports.createUser = async (req, res) => {
  try {
    const { name, email, role = 'user', sendInvitation = true } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Nombre y email requeridos' });
    }

    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({ error: 'Rol inválido' });
    }

    // Verificar email único en el tenant
    const existingUser = await db.User.findOne({
      where: { 
        email: email.toLowerCase(),
        tenantId: req.user.tenantId 
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email ya existe en tu empresa' });
    }

    // Generar contraseña temporal
    const tempPassword = crypto.randomBytes(8).toString('hex');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Crear usuario
    const user = await db.User.create({
      tenantId: req.user.tenantId,
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      isTemporaryPassword: true
    });

    // Enviar invitación por email
    if (sendInvitation) {
      await EmailService.sendUserInvitation(user, req.tenant, tempPassword);
    }

    logger.info('User created', { 
      userId: user.id, 
      email: user.email, 
      role: user.role,
      tenantId: req.user.tenantId 
    });

    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    });
  } catch (error) {
    logger.error('Error creating user', { error: error.message });
    res.status(500).json({ error: 'Error creando usuario' });
  }
};

// Actualizar usuario
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role } = req.body;

    const user = await db.User.findOne({
      where: { 
        id, 
        tenantId: req.user.tenantId 
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // No permitir cambiar el rol del último admin
    if (role && role !== user.role && user.role === 'admin') {
      const adminCount = await db.User.count({
        where: { 
          tenantId: req.user.tenantId, 
          role: 'admin' 
        }
      });

      if (adminCount <= 1) {
        return res.status(400).json({ 
          error: 'No puedes cambiar el rol del último administrador' 
        });
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (role && ['admin', 'user'].includes(role)) updateData.role = role;

    await user.update(updateData);

    logger.info('User updated', { 
      userId: user.id, 
      updates: updateData,
      tenantId: req.user.tenantId 
    });

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    logger.error('Error updating user', { error: error.message });
    res.status(500).json({ error: 'Error actualizando usuario' });
  }
};

// Eliminar usuario
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await db.User.findOne({
      where: { 
        id, 
        tenantId: req.user.tenantId 
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // No permitir eliminar el último admin
    if (user.role === 'admin') {
      const adminCount = await db.User.count({
        where: { 
          tenantId: req.user.tenantId, 
          role: 'admin' 
        }
      });

      if (adminCount <= 1) {
        return res.status(400).json({ 
          error: 'No puedes eliminar el último administrador' 
        });
      }
    }

    // No permitir auto-eliminarse
    if (user.id === req.user.id) {
      return res.status(400).json({ 
        error: 'No puedes eliminarte a ti mismo' 
      });
    }

    await user.destroy();

    logger.info('User deleted', { 
      userId: user.id, 
      email: user.email,
      tenantId: req.user.tenantId 
    });

    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    logger.error('Error deleting user', { error: error.message });
    res.status(500).json({ error: 'Error eliminando usuario' });
  }
};

// ========== INVITACIONES ==========

// Enviar invitación a usuario existente
exports.sendInvitation = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await db.User.findOne({
      where: { 
        id, 
        tenantId: req.user.tenantId 
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Generar nueva contraseña temporal
    const tempPassword = crypto.randomBytes(8).toString('hex');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    await user.update({
      password: hashedPassword,
      isTemporaryPassword: true
    });

    // Enviar invitación
    await EmailService.sendUserInvitation(user, req.tenant, tempPassword);

    logger.info('Invitation sent', { 
      userId: user.id, 
      email: user.email,
      tenantId: req.user.tenantId 
    });

    res.json({ message: 'Invitación enviada correctamente' });
  } catch (error) {
    logger.error('Error sending invitation', { error: error.message });
    res.status(500).json({ error: 'Error enviando invitación' });
  }
};

// ========== PERFIL DE USUARIO ==========

// Cambiar contraseña propia
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Contraseña actual y nueva requeridas' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Nueva contraseña debe tener mínimo 6 caracteres' });
    }

    const user = await db.User.findByPk(req.user.id);

    // Verificar contraseña actual
    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Contraseña actual incorrecta' });
    }

    // Actualizar contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({
      password: hashedPassword,
      isTemporaryPassword: false
    });

    logger.info('Password changed', { userId: user.id });

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    logger.error('Error changing password', { error: error.message });
    res.status(500).json({ error: 'Error cambiando contraseña' });
  }
};

// Actualizar perfil propio
exports.updateProfile = async (req, res) => {
  try {
    const { name } = req.body;

    const user = await db.User.findByPk(req.user.id);

    if (name) {
      await user.update({ name });
    }

    logger.info('Profile updated', { userId: user.id });

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    logger.error('Error updating profile', { error: error.message });
    res.status(500).json({ error: 'Error actualizando perfil' });
  }
};

// ========== VALIDACIONES DE SEGURIDAD ==========

// Validar fortaleza de contraseña
const validatePasswordStrength = (password) => {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('Mínimo 8 caracteres');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Al menos una mayúscula');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Al menos una minúscula');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Al menos un número');
  }
  
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Al menos un carácter especial');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Middleware para validar contraseña
exports.validatePassword = (req, res, next) => {
  const { password } = req.body;
  
  if (password) {
    const validation = validatePasswordStrength(password);
    if (!validation.isValid) {
      return res.status(400).json({ 
        error: 'Contraseña débil',
        details: validation.errors
      });
    }
  }
  
  next();
};

// ========== LOGS DE AUDITORÍA ==========

// Registrar actividad de usuario
exports.logActivity = async (req, res) => {
  try {
    const { action, details } = req.body;

    // Crear log de actividad
    await db.ActivityLog.create({
      tenantId: req.user.tenantId,
      userId: req.user.id,
      action,
      details: details || {},
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({ message: 'Actividad registrada' });
  } catch (error) {
    logger.error('Error logging activity', { error: error.message });
    res.status(500).json({ error: 'Error registrando actividad' });
  }
};

// Obtener logs de actividad
exports.getActivityLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const logs = await db.ActivityLog.findAndCountAll({
      where: { tenantId: req.user.tenantId },
      include: [{
        model: db.User,
        as: 'user',
        attributes: ['name', 'email']
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      logs: logs.rows,
      total: logs.count,
      page: parseInt(page),
      totalPages: Math.ceil(logs.count / limit)
    });
  } catch (error) {
    logger.error('Error getting activity logs', { error: error.message });
    res.status(500).json({ error: 'Error obteniendo logs' });
  }
};
