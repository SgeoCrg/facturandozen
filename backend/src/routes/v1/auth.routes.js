const express = require('express');
const router = express.Router();
const authController = require('../../controllers/auth.controller');
const { authenticateToken } = require('../../middleware/auth');
const { 
  loginLimiter, 
  registerLimiter, 
  passwordResetLimiter,
  validateInput,
  validateHeaders 
} = require('../../middleware/security');

router.post('/register', registerLimiter, validateHeaders, validateInput, authController.register);
router.post('/login', loginLimiter, authController.login);
router.get('/me', authenticateToken, authController.me);
router.post('/forgot-password', passwordResetLimiter, validateHeaders, validateInput, authController.forgotPassword);
router.post('/reset-password', passwordResetLimiter, validateHeaders, validateInput, authController.resetPassword);

module.exports = router;
