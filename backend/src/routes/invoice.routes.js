const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoice.controller');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', invoiceController.list);
router.get('/export/csv', invoiceController.exportCSV);
router.post('/', invoiceController.create);
router.get('/:id', invoiceController.get);
router.get('/:id/pdf', invoiceController.generatePDF);

module.exports = router;
