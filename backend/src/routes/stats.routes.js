const express = require('express');
const router = express.Router();
const statsController = require('../controllers/stats.controller');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/dashboard', statsController.getDashboardStats);
router.get('/trend', statsController.getInvoicesTrend);

module.exports = router;



