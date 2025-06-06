const ownerController = require('../controllers/owner.controller');
const auth = require('../middleware/auth');
const isOwner = require('../middleware/isOwner');
const express = require('express');
const wrapRoutes = require('../helpers/wrapRoutes');
const router = wrapRoutes(express.Router());

// [Owner] - Get all information for private profile page
router.get('/me', [auth, isOwner], ownerController.getMe);

// [Owner] - Update owner information
router.patch('/me', [auth, isOwner], ownerController.updateMe);

// [Owner] - Delete customer
router.delete('/me', [auth, isOwner], ownerController.deleteMe);

module.exports = router;