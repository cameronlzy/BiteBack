const ownerService = require('../services/owner.service');

exports.getMe = async (req, res) => {
    const data = await ownerService.getMe(req.user._id);
    return res.status(data.status).send(data.body);
};

exports.updateMe = async (req, res) => {
    const data = await ownerService.updateMe(req.body, req.user);
    return res.header('x-auth-token', data.token).send(data.body);
};