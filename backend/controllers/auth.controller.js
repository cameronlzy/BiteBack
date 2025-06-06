const authService = require('../services/auth.service');
const { validateLogin, validateCredentials } = require('../validators/user.validator');
const { validateCustomer } = require('../validators/customerProfile.validator');
const { validateOwner } = require('../validators/ownerProfile.validator');
const setAuthCookie = require('../helpers/setAuthCookie');

exports.forgotPassword = async (req, res) => {
    // validate request
    validateCredentials(req.body);
    
    const { status, body } = await authService.forgotPassword(req.body);
    return res.status(status).json(body);
};

exports.resetPassword = async (req, res) => {
    // add validation

    const { status, body } = await authService.resetPassword(req.body, req.params.token);
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
    validateLogin(req.body);

    const { token, body, status } = await authService.login(req.body);
    if (token) setAuthCookie(res, token);
    return res.status(status).json(body);
};

exports.registerCustomer = async (req, res) => {
    // validate request
    const { error } = validateCustomer(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const {token, body, status } = await authService.registerCustomer(req.body);
    if (token) setAuthCookie(res, token);
    return res.status(status).json(body);
};

exports.registerOwner = async (req, res) => {
    // validate request
    const { error } = validateOwner(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const { token, body, status } = await authService.registerOwner(req.body);
    if (token) setAuthCookie(res, token);
    return res.status(status).json(body);
};