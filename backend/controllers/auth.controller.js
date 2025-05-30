const authService = require('../services/auth.service');
const { validateLogin } = require('../validators/user.validator');
const { validateCustomer } = require('../validators/customerProfile.validator');
const { validateOwner } = require('../validators/ownerProfile.validator');

exports.login = async (req, res) => {
    // validate request
    validateLogin(req.body);

    const data = await authService.login(req.body);
    return res.header('x-auth-token', data.token).status(data.status).send(data.body);
};

exports.registerCustomer = async (req, res) => {
    // validate request
    const { error } = validateCustomer(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const data = await authService.registerCustomer(req.body);
    return res.header('x-auth-token', data.token).status(data.status).send(data.body);
};

exports.registerOwner = async (req, res) => {
    // validate request
    const { error } = validateOwner(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const data = await authService.registerOwner(req.body);
    return res.header('x-auth-token', data.token).status(data.status).send(data.body);
};