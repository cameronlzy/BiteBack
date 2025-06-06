const express = require('express');
const authController = require('../controllers/auth.controller');
const wrapRoutes = require('../helpers/wrapRoutes');
const router = wrapRoutes(express.Router());

// [Public] - Generate token for password reset
router.post('/forget-password', authController.forgotPassword);

// [Public] - Validates token to reset password
router.post('/reset-password/:token', authController.resetPassword);

// [Public] - Log out
router.post('/logout', authController.logout);

// [Public] - Login via username or email + password
router.post('/login', authController.login);

// [Public] - Registration for owners
router.post('/register/owner', authController.registerOwner);

// [Public] - Registration for customers
router.post('/register/customer', authController.registerCustomer);

module.exports = router; 
