const express = require('express');
const router = express.Router();
const multer = require('multer');
const verifactuController = require('../controllers/verifactu.controller');
const { authenticateToken } = require('../middleware/auth');

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/x-pkcs12' || 
        file.originalname.match(/\.(p12|pfx)$/)) {
      cb(null, true);
    } else {
      cb(new Error('Solo archivos .p12 o .pfx'));
    }
  }
});

router.use(authenticateToken);

router.post('/certificate', upload.single('certificate'), verifactuController.uploadCertificate);
router.get('/certificate/status', verifactuController.getCertificateStatus);
router.delete('/certificate', verifactuController.deleteCertificate);
router.post('/invoices/:id/send', verifactuController.sendInvoice);

// Nuevos endpoints para retry automático
router.get('/stats', verifactuController.getStats);
router.post('/invoices/:id/retry', verifactuController.retryInvoice);
router.post('/process-pending', verifactuController.processPending);

module.exports = router;



