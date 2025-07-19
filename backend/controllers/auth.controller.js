import config from 'config';
import passport from 'passport';
import * as authService from '../services/auth.service.js';
import { validateRole, validateLogin, validateCredentials, validatePassword, validatePasswordChange, validateUser, validateEmail } from '../validators/auth.validator.js';
import { validateStaffLogin } from '../validators/staff.validator.js';
import { setAuthCookie } from '../helpers/cookie.helper.js';
import { wrapError, wrapMessage } from '../helpers/response.js';
import { generateTempToken, generateAuthToken } from '../helpers/token.helper.js';

export async function googleRedirect(req, res, next) {
    const { error, value } = validateRole(req.query);
    if (error) return res.status(400).json(wrapError(error.details[0].message));

    passport.authenticate('google', {
        scope: ['profile', 'email'],
        state: value.role,
    })(req, res, next);
}

export async function googleCallback(req, res) {
    const token = req.user._isNew
        ? generateTempToken(req.user)
        : generateAuthToken(req.user);

    setAuthCookie(res, token);

    const redirectPath = req.user._isNew
        ? `/complete-signup/${req.user.role}`
        : ``;

    return res.redirect(`${config.get('frontendLink')}${redirectPath}`);
}

export async function register(req, res) {
    // validate request
    const { error, value } = validateUser(req.body);
    if (error) return res.status(400).json(wrapError(error.details[0].message));

    const {token, body, status } = await authService.register(value);
    if (token) setAuthCookie(res, token);
    return res.status(status).json(body);
}

export async function verifyEmail(req, res) {
    const { token, status, body } = await authService.verifyEmail(req.params.token);
    if (token) setAuthCookie(res, token);
    return res.status(status).send(body);
}

export async function resendVerification(req, res) {
    const { error, value } = validateEmail(req.body);
    if (error) return res.status(400).json(wrapError(error.details[0].message));
    
    const { status, body } = await authService.resendVerification(value);
    return res.status(status).json(body);
}

export async function setPassword(req, res) {
    const { error, value } = validatePassword(req.body);
    if (error) return res.status(400).json(wrapError(error.details[0].message));
    
    const { status, body } = await authService.setPassword(req.user, value);
    return res.status(status).json(body);
}

export async function forgotPassword(req, res) {
    // validate request
    const { error, value } = validateCredentials(req.body);
    if (error) return res.status(400).json(wrapError(error.details[0].message));
    
    const { status, body } = await authService.forgotPassword(value);
    return res.status(status).json(body);
};

export async function resetPassword(req, res) {
    const { error, value } = validatePassword(req.body);
    if (error) return res.status(400).json(wrapError(error.details[0].message));

    const { status, body } = await authService.resetPassword(value, req.params.token);
    return res.status(status).json(body);
};

export async function changePassword(req, res) {
    const { error, value } = validatePasswordChange(req.body);
    if (error) return res.status(400).json(wrapError(error.details[0].message));
    
    const { status, body } = await authService.changePassword(value, req.user);
    return res.status(status).json(body);
};

export async function logout(req, res) {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
    });
    res.status(200).json(wrapMessage('Logged out successfully'));
};

export async function login(req, res) {
    // validate request
    const { error, value } = validateLogin(req.body);
    if (error) return res.status(400).json(wrapError(error.details[0].message));

    const { token, body, status } = await authService.login(value);
    if (token) setAuthCookie(res, token);
    return res.status(status).json(body);
};

export async function staffLogin(req, res) {
    // validate request
    const { error, value } = validateStaffLogin(req.body);
    if (error) return res.status(400).json(wrapError(error.details[0].message));

    const { token, body, status } = await authService.staffLogin(value);
    if (token) setAuthCookie(res, token, 12);
    return res.status(status).json(body);
};