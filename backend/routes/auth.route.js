import express from 'express';
import passport from 'passport';
import config from 'config';
import auth from '../middleware/auth.js';
import requireTempAuth from '../middleware/requireTempAuth.js';
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

// [Public] - Registration for owners and customers
router.post('/register', authController.register);

// [Public] - Validate token to verify email
router.post('/verify-email/:token', authController.verifyEmail);

// [Public] - Resend verification email
router.post('/resend-verification', authController.resendVerification);

// [User] - Sets password for the first time (for google oauth)
router.post('/set-password', [auth, requireTempAuth], authController.setPassword);

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

// [Staff] - Login for staff
router.post('/login/staff', authController.staffLogin);

export default router;
