const express = require('express');
const router = express.Router();
const billingController = require('../../controllers/billing.controller');
const auth = require('../../middleware/auth');

// Middleware de autenticación para todas las rutas
router.use(auth.authenticateToken);

// Rutas de facturación
router.post('/checkout', billingController.createCheckoutSession);
router.post('/portal', billingController.createBillingPortalSession);
router.post('/cancel', billingController.cancelSubscription);
router.post('/reactivate', billingController.reactivateSubscription);
router.post('/change-plan', billingController.changePlan);
router.get('/status', billingController.getBillingStatus);
router.get('/payments', billingController.getPaymentHistory);

// Webhook de Stripe (protegido con validación de IP y firma)
router.post('/webhook', express.raw({ type: 'application/json' }), (req, res, next) => {
  // Validar IP de Stripe (opcional pero recomendado)
  const allowedIPs = process.env.STRIPE_WEBHOOK_IPS ? 
    process.env.STRIPE_WEBHOOK_IPS.split(',') : [];
  
  if (allowedIPs.length > 0 && !allowedIPs.includes(req.ip)) {
    return res.status(403).json({ error: 'IP not allowed' });
  }
  
  next();
}, billingController.handleWebhook);

module.exports = router;
