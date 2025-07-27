import express from 'express';
import passport from 'passport';
import config from 'config';
import auth from '../middleware/auth.js';
import tempAuth from '../middleware/tempAuth.js';
import * as authController from '../controllers/auth.controller.js';
import wrapRoutes from '../helpers/wrapRoutes.js';

const router = wrapRoutes(express.Router());

// [Public] - Google oauth
router.get('/google', authController.googleRedirect);

// [Public] - Google oauth callback
router.get('/google/callback', passport.authenticate('google', {
    session: false,
    failureRedirect: `${config.get('frontendLink')}/login`
}), authController.googleCallback);

// [Public] - Exchange temp token for real token
router.post('/consume-token', authController.consumeToken);

// [Public] - Registration for owners and customers
router.post('/register', authController.register);

// [Public] - Validate token to verify email
router.post('/verify-email', authController.verifyEmail);

// [Public] - Resend verification email
router.post('/resend-verification', authController.resendVerification);

// [User] - Sets password for the first time (for google oauth)
router.post('/set-credentials', [tempAuth], authController.setCredentials);

// [Public] - Generate token for password reset
router.post('/forget-password', authController.forgotPassword);

// [Public] - Validates token to reset password
router.post('/reset-password', authController.resetPassword);

// [User] - Change user's password
router.put('/change-password', [auth], authController.changePassword);

// [Public] - Log out
router.post('/logout', authController.logout);

// [Public] - Login for owners and customers via username or email + password
router.post('/login', authController.login);

// [Staff] - Login for staff
router.post('/login/staff', authController.staffLogin);

export default router;
