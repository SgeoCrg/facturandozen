const express = require('express');
const router = express.Router();
const userController = require('../../controllers/user.controller');
const { authenticateToken, requireAdmin } = require('../../middleware/auth');

// ========== GESTIÓN DE USUARIOS ==========

// Listar usuarios del tenant
router.get('/', authenticateToken, userController.getUsers);

// Crear usuario (solo admin)
router.post('/', authenticateToken, requireAdmin, userController.validatePassword, userController.createUser);

// Actualizar usuario (solo admin)
router.put('/:id', authenticateToken, requireAdmin, userController.updateUser);

// Eliminar usuario (solo admin)
router.delete('/:id', authenticateToken, requireAdmin, userController.deleteUser);

// ========== INVITACIONES ==========

// Enviar invitación a usuario existente
router.post('/:id/invite', authenticateToken, requireAdmin, userController.sendInvitation);

// ========== PERFIL DE USUARIO ==========

// Cambiar contraseña propia
router.post('/change-password', authenticateToken, userController.validatePassword, userController.changePassword);

// Actualizar perfil propio
router.put('/profile', authenticateToken, userController.updateProfile);

// ========== LOGS DE AUDITORÍA ==========

// Registrar actividad
router.post('/activity', authenticateToken, userController.logActivity);

// Obtener logs de actividad (solo admin)
router.get('/activity', authenticateToken, requireAdmin, userController.getActivityLogs);

module.exports = router;
