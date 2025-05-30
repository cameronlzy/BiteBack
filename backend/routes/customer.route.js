const auth = require('../middleware/auth');
const customerController = require('../controllers/customer.controller');
const express = require('express');
const wrapRoutes = require('../helpers/wrapRoutes');
const validateObjectId = require('../middleware/validateObjectId');
const router = wrapRoutes(express.Router());

router.get('/me', auth, customerController.getMe);

router.get('/:id', validateObjectId, customerController.getProfile);

router.put('/me', auth, customerController.updateMe);

module.exports = router;