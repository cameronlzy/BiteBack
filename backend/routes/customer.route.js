const auth = require('../middleware/auth');
const customerController = require('../controllers/customer.controller');
const express = require('express');
const wrapRoutes = require('../helpers/wrapRoutes');
const validateObjectId = require('../middleware/validateObjectId');
const isCustomer = require('../middleware/isCustomer');
const router = wrapRoutes(express.Router());

// [Customer] - Get all information for private profile page
router.get('/me', [auth, isCustomer], customerController.getMe);

// [Public] - Get information for public profile page
router.get('/:id', validateObjectId, customerController.publicProfile);

// [Customer] - Update customer information
router.patch('/me', [auth, isCustomer], customerController.updateMe);

// [Customer] - Delete customer
router.delete('/me', [auth, isCustomer], customerController.deleteMe);

module.exports = router;