import * as authService from '../services/auth.service.js';
import { validateLogin, validateCredentials, validatePassword, validatePasswordChange } from '../validators/user.validator.js';
import { validateCustomer } from '../validators/customerProfile.validator.js';
import { validateOwner } from '../validators/ownerProfile.validator.js';
import { validateStaffLogin } from '../validators/staff.validator.js';
import { setAuthCookie } from '../helpers/cookie.helper.js';
import { wrapError } from '../helpers/response.js';

export async function forgotPassword (req, res) {
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
    
    const { token, status, body } = await authService.changePassword(value, req.user);
    if (token) setAuthCookie(res, token);
    return res.status(status).json(body);
};

export async function logout(req, res) {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
    });
    res.status(200).json({ message: 'Logged out successfully' });
};

export async function login(req, res) {
    // validate request
    const { error, value } = validateLogin(req.body);
    if (error) return res.status(400).json(wrapError(error.details[0].message));

    const { token, body, status } = await authService.login(value);
    if (token) setAuthCookie(res, token);
    return res.status(status).json(body);
};

export async function register(req, res) {
    // validate request
    if (req.body.role === 'customer') {
        const { error, value } = validateCustomer(req.body);
        if (error) return res.status(400).json(wrapError(error.details[0].message));

        const {token, body, status } = await authService.registerCustomer(value);
        if (token) setAuthCookie(res, token);
        return res.status(status).json(body);
    } else if (req.body.role === 'owner') {
        const { error, value } = validateOwner(req.body);
        if (error) return res.status(400).json(wrapError(error.details[0].message));

        const { token, body, status } = await authService.registerOwner(value);
        if (token) setAuthCookie(res, token);
        return res.status(status).json(body);
    } else {
        return res.status(400).json(wrapError('Invalid role'));
    }
};

export async function staffLogin(req, res) {
    // validate request
    const { error, value } = validateStaffLogin(req.body);
    if (error) return res.status(400).json(wrapError(error.details[0].message));

    const { token, body, status } = await authService.staffLogin(value);
    if (token) setAuthCookie(res, token, 12);
    return res.status(status).json(body);
};