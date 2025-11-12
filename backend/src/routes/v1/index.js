/**
 * API v1 Router
 * Todas las rutas versionadas bajo /api/v1
 */

const express = require('express');
const router = express.Router();

// Importar todas las rutas versionadas
router.use('/auth', require('./auth.routes'));
router.use('/users', require('./user.routes'));
router.use('/superadmin', require('./superadmin.routes'));
router.use('/verifactu', require('./verifactu.routes'));
router.use('/stats', require('./stats.routes'));
router.use('/customers', require('./customer.routes'));
router.use('/products', require('./product.routes'));
router.use('/invoices', require('./invoice.routes'));
router.use('/settings', require('./settings.routes'));
router.use('/billing', require('./billing.routes'));
router.use('/lopd', require('./lopd.routes'));
router.use('/affiliates', require('./affiliate.routes'));
router.use('/public', require('./public.routes'));

module.exports = router;




