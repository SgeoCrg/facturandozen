const express = require('express');
const router = express.Router();
const lopdController = require('../controllers/lopd.controller');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { 
  auditDataAccess, 
  auditCreate, 
  auditUpdate, 
  auditView,
  logRequestInfo 
} = require('../middleware/audit');

// Middleware para todas las rutas
router.use(authenticateToken);
router.use(logRequestInfo);

// ===== CONSENTIMIENTOS =====

// Otorgar consentimiento
router.post('/consents', 
  auditCreate('consent'),
  lopdController.grantConsent
);

// Revocar consentimiento
router.delete('/consents', 
  auditUpdate('consent'),
  lopdController.revokeConsent
);

// Obtener consentimientos
router.get('/consents', 
  auditView('consent'),
  lopdController.getConsents
);

// ===== SOLICITUDES DE DERECHOS =====

// Crear solicitud de derechos
router.post('/data-requests', 
  auditCreate('data_request'),
  lopdController.createDataRequest
);

// Verificar solicitud (público, sin autenticación)
router.get('/data-requests/verify/:token', 
  lopdController.verifyDataRequest
);

// Obtener solicitudes (solo admin)
router.get('/data-requests', 
  requireAdmin,
  auditView('data_request'),
  lopdController.getDataRequests
);

// Procesar solicitud (solo admin)
router.put('/data-requests/:id', 
  requireAdmin,
  auditUpdate('data_request'),
  lopdController.processDataRequest
);

// ===== POLÍTICAS DE PRIVACIDAD =====

// Crear política de privacidad (solo admin)
router.post('/privacy-policies', 
  requireAdmin,
  auditCreate('privacy_policy'),
  lopdController.createPrivacyPolicy
);

// Obtener política activa
router.get('/privacy-policies/active', 
  auditView('privacy_policy'),
  lopdController.getPrivacyPolicy
);

// Obtener historial de políticas (solo admin)
router.get('/privacy-policies/history', 
  requireAdmin,
  auditView('privacy_policy'),
  lopdController.getPrivacyPolicyHistory
);

// ===== REPORTES Y AUDITORÍA =====

// Reporte de actividad (solo admin)
router.get('/reports/activity', 
  requireAdmin,
  auditView('activity_report'),
  lopdController.getActivityReport
);

// Reporte de consentimientos (solo admin)
router.get('/reports/consents', 
  requireAdmin,
  auditView('consent_report'),
  lopdController.getConsentReport
);

// ===== DERECHOS DE LOS INTERESADOS =====

// Obtener datos del usuario
router.get('/user-data', 
  auditDataAccess('user_data'),
  lopdController.getUserData
);

// Eliminar datos del usuario (solo admin)
router.delete('/user-data', 
  requireAdmin,
  lopdController.deleteUserData
);

module.exports = router;
