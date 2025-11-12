const express = require('express');
const router = express.Router();
const affiliateController = require('../controllers/affiliate.controller');
const { authenticateToken, requireSuperadmin, requireAuth } = require('../middleware/auth');

// Rutas protegidas para superadmin
router.use(authenticateToken);
router.use(requireSuperadmin);

/**
 * @route   POST /api/affiliates
 * @desc    Crear nuevo afiliado
 * @access  Superadmin
 */
router.post('/', affiliateController.createAffiliate);

/**
 * @route   GET /api/affiliates
 * @desc    Obtener lista de afiliados
 * @access  Superadmin
 */
router.get('/', affiliateController.getAffiliates);

/**
 * @route   GET /api/affiliates/stats
 * @desc    Obtener estadísticas globales
 * @access  Superadmin
 */
router.get('/stats', affiliateController.getGlobalStats);

/**
 * @route   GET /api/affiliates/pending-commissions
 * @desc    Obtener comisiones pendientes
 * @access  Superadmin
 */
router.get('/pending-commissions', affiliateController.getPendingCommissions);

/**
 * @route   GET /api/affiliates/:id
 * @desc    Obtener detalles de afiliado
 * @access  Superadmin
 */
router.get('/:id', affiliateController.getAffiliate);

/**
 * @route   PUT /api/affiliates/:id
 * @desc    Actualizar afiliado
 * @access  Superadmin
 */
router.put('/:id', affiliateController.updateAffiliate);

/**
 * @route   DELETE /api/affiliates/:id
 * @desc    Eliminar afiliado
 * @access  Superadmin
 */
router.delete('/:id', affiliateController.deleteAffiliate);

/**
 * @route   GET /api/affiliates/:code/link
 * @desc    Generar enlace de afiliado
 * @access  Superadmin
 */
router.get('/:code/link', affiliateController.generateAffiliateLink);

/**
 * @route   POST /api/affiliates/commissions/:id/pay
 * @desc    Pagar comisión
 * @access  Superadmin
 */
router.post('/commissions/:id/pay', affiliateController.payCommission);

// Rutas para clientes (sin requireSuperadmin)
router.use('/my', authenticateToken);

/**
 * @route   GET /api/affiliates/my-affiliates
 * @desc    Obtener afiliados del cliente actual
 * @access  Cliente autenticado
 */
router.get('/my-affiliates', affiliateController.getMyAffiliates);

/**
 * @route   GET /api/affiliates/my-stats
 * @desc    Obtener estadísticas del cliente actual
 * @access  Cliente autenticado
 */
router.get('/my-stats', affiliateController.getMyStats);

/**
 * @route   POST /api/affiliates/my
 * @desc    Crear afiliado para el cliente actual
 * @access  Cliente autenticado
 */
router.post('/my', affiliateController.createMyAffiliate);

module.exports = router;