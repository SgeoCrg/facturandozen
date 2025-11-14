const express = require('express');
const router = express.Router();
const settingsController = require('../../controllers/settings.controller');
const { authenticateToken } = require('../../middleware/auth');

router.use(authenticateToken);

router.get('/', settingsController.get);
router.put('/', settingsController.update);

module.exports = router;



