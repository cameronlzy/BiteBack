const authService = require('../services/auth.service');
const { validateLogin, validateCredentials, validatePassword, validatePasswordChange } = require('../validators/user.validator');
const { validateCustomer } = require('../validators/customerProfile.validator');
const { validateOwner } = require('../validators/ownerProfile.validator');
const { validateStaffLogin } = require('../validators/staff.validator');
const { setAuthCookie } = require('../helpers/cookie.helper');

exports.forgotPassword = async (req, res) => {
    // validate request
    validateCredentials(req.body);
    
    const { status, body } = await authService.forgotPassword(req.body);
    return res.status(status).json(body);
};

exports.resetPassword = async (req, res) => {
    const { error } = validatePassword(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const { status, body } = await authService.resetPassword(req.body, req.params.token);
    return res.status(status).json(body);
};

exports.changePassword = async (req, res) => {
    const { error } = validatePasswordChange(req.body);
    if (error) return res.status(400).send(error.details[0].message);
    
    const { token, status, body } = await authService.changePassword(req.body, req.user);
    if (token) setAuthCookie(res, token);
    return res.status(status).json(body);
};

exports.logout = async (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
    });
    res.status(200).json({ message: 'Logged out successfully' });
};

exports.login = async (req, res) => {
    // validate request
    const { error } = validateLogin(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const { token, body, status } = await authService.login(req.body);
    if (token) setAuthCookie(res, token);
    return res.status(status).json(body);
};

exports.register = async (req, res) => {
    // validate request
    if (req.body.role === 'customer') {
        const { error } = validateCustomer(req.body);
        if (error) return res.status(400).send(error.details[0].message);

        const {token, body, status } = await authService.registerCustomer(req.body);
        if (token) setAuthCookie(res, token);
        return res.status(status).json(body);
    } else if (req.body.role === 'owner') {
        const { error } = validateOwner(req.body);
        if (error) return res.status(400).send(error.details[0].message);

        const { token, body, status } = await authService.registerOwner(req.body);
        if (token) setAuthCookie(res, token);
        return res.status(status).json(body);
    } else {
        return res.status(400).send('Invalid role');
    }
};

exports.staffLogin = async (req, res) => {
    // validate request
    const { error } = validateStaffLogin(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const { token, body, status } = await authService.staffLogin(req.body);
    if (token) setAuthCookie(res, token);
    return res.status(status).json(body);
};