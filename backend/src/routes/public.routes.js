const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const AffiliateService = require('../services/AffiliateService');
const { validateInput } = require('../middleware/security');

// Rate limiting específico para rutas públicas
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 50, // máximo 50 requests por IP
  message: 'Demasiadas peticiones desde esta IP',
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(publicLimiter);
router.use(validateInput);

/**
 * @route   GET /api/public/affiliate/:code/validate
 * @desc    Validar código de afiliado (público)
 * @access  Public
 */
router.get('/affiliate/:code/validate', async (req, res) => {
  try {
    const { code } = req.params;
    
    // Validar formato del código
    if (!code || code.length < 3 || code.length > 20 || !/^[a-zA-Z0-9_-]+$/.test(code)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de código inválido'
      });
    }
    
    const isValid = await AffiliateService.validateAffiliateCode(code);
    
    res.json({
      success: true,
      valid: isValid,
      code: code.substring(0, 3) + '***' // Ocultar código completo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error validando código'
    });
  }
});

/**
 * @route   GET /api/public/affiliate/:code/link
 * @desc    Generar enlace de afiliado (público)
 * @access  Public
 */
router.get('/affiliate/:code/link', async (req, res) => {
  try {
    const { code } = req.params;
    
    // Validar formato del código
    if (!code || code.length < 3 || code.length > 20 || !/^[a-zA-Z0-9_-]+$/.test(code)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de código inválido'
      });
    }
    
    const isValid = await AffiliateService.validateAffiliateCode(code);
    if (!isValid) {
      return res.status(404).json({
        success: false,
        message: 'Código de afiliado inválido'
      });
    }
    
    const link = AffiliateService.generateAffiliateLink(code);
    
    res.json({
      success: true,
      link,
      code: code.substring(0, 3) + '***' // Ocultar código completo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generando enlace'
    });
  }
});

module.exports = router;
