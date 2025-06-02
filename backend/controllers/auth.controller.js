const authService = require('../services/auth.service');
const { validateLogin } = require('../validators/user.validator');
const { validateCustomer } = require('../validators/customerProfile.validator');
const { validateOwner } = require('../validators/ownerProfile.validator');
const setAuthCookie = require('../helpers/setAuthCookie');

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