const express = require('express');
const authController = require('../controllers/auth.controller');
const wrapRoutes = require('../helpers/wrapRoutes');
const router = wrapRoutes(express.Router());

router.post('/login', authController.login);

router.post('/register/owner', authController.registerOwner);

router.post('/register/customer', authController.registerCustomer);

module.exports = router; 
