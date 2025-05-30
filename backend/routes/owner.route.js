const ownerController = require('../controllers/owner.controller');
const auth = require('../middleware/auth');
const express = require('express');
const wrapRoutes = require('../helpers/wrapRoutes');
const router = wrapRoutes(express.Router());

router.get('/me', auth, ownerController.getMe);

router.put('/me', auth, ownerController.updateMe);

module.exports = router;