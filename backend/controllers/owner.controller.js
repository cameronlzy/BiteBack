const ownerService = require('../services/owner.service');
const { validateNewOwner } = require('../validators/ownerProfile.validator');

exports.getMe = async (req, res) => {
    const data = await ownerService.getMe(req.user._id);
    return res.status(data.status).send(data.body);
};

exports.updateMe = async (req, res) => {
    req.body.role = 'owner';
    // validate request change validation for patch
    const { error } = validateNewOwner(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const data = await ownerService.updateMe(req.body, req.user);
    return res.header('x-auth-token', data.token).send(data.body);
};