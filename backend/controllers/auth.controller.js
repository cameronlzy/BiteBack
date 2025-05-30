const authService = require('../services/auth.service');

exports.login = async (req, res) => {
    const data = await authService.login(req.body);
    return res.header('x-auth-token', data.token).status(data.status).send(data.body);
};

exports.registerCustomer = async (req, res) => {
    const data = await authService.registerCustomer(req.body);
    return res.header('x-auth-token', data.token).status(data.status).send(data.body);
};

exports.registerOwner = async (req, res) => {
    const data = await authService.registerOwner(req.body);
    return res.header('x-auth-token', data.token).status(data.status).send(data.body);
};