const customerService = require('../services/customer.service');

exports.getMe = async (req, res) => {
    const data = await customerService.getMe(req.user._id);
    return res.status(data.status).send(data.body);
};

exports.getProfile = async (req, res) => {
    const data = await customerService.getProfile(req.params.id);
    return res.status(data.status).send(data.body);
};

exports.updateMe = async (req, res) => {
    const data = await customerService.updateMe(req.body, req.user);
    return res.header('x-auth-token', data.token).send(data.body);
};
