const express = require('express');
const router = express.Router();
const superadminController = require('../../controllers/superadmin.controller');
const { authenticateToken, requireSuperadmin } = require('../../middleware/auth');

router.use(authenticateToken);
router.use(requireSuperadmin);

router.get('/tenants', superadminController.getTenants);
router.post('/tenants', superadminController.createTenant);
router.get('/tenants/:id', superadminController.getTenantDetail);
router.put('/tenants/:id/status', superadminController.updateTenantStatus);
router.put('/tenants/:id/subscription', superadminController.updateSubscription);
router.delete('/tenants/:id', superadminController.deleteTenant);
router.get('/stats', superadminController.getStats);

// ========== GESTIÓN DE USUARIOS (CRUD) ==========
router.get('/users', superadminController.getAllUsers);
router.get('/users/:id', superadminController.getUserDetail);
router.post('/users', superadminController.createUser);
router.put('/users/:id', superadminController.updateUser);
router.delete('/users/:id', superadminController.deleteUser);
router.post('/users/:id/reset-password', superadminController.resetUserPassword);

module.exports = router;



