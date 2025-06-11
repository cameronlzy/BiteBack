const express = require('express');
const auth = require('../middleware/auth');
const authController = require('../controllers/auth.controller');
const wrapRoutes = require('../helpers/wrapRoutes');
const router = wrapRoutes(express.Router());

// [Public] - Generate token for password reset
router.post('/forget-password', authController.forgotPassword);

// [Public] - Validates token to reset password
router.post('/reset-password/:token', authController.resetPassword);

// [User] - Change user's password
router.put('/change-password', auth, authController.changePassword);

// [Public] - Log out
router.post('/logout', authController.logout);

// [Public] - Login for owners and customers via username or email + password
router.post('/login', authController.login);

// [Public] - Registration for owners and customers
router.post('/register', authController.register);

// [Staff] - Login for staff
router.post('/login/staff', authController.staffLogin);

module.exports = router; 
