const express = require('express');
const router = express.Router();
const customerController = require('../../controllers/customer.controller');
const { authenticateToken } = require('../../middleware/auth');

router.use(authenticateToken);

router.get('/', customerController.list);
router.post('/', customerController.create);
router.get('/:id', customerController.get);
router.put('/:id', customerController.update);
router.delete('/:id', customerController.delete);

module.exports = router;
