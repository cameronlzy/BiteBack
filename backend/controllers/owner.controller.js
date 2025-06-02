const ownerService = require('../services/owner.service');
const { validateNewOwner, validatePatch } = require('../validators/ownerProfile.validator');
const setAuthCookie = require('../helpers/setAuthCookie');

exports.getMe = async (req, res) => {
    const { status, body } = await ownerService.getMe(req.user._id);
    return res.status(status).json(body);
};

exports.updateMe = async (req, res) => {
    // validate request
    const { error } = validatePatch(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const { token, status, body } = await ownerService.updateMe(req.body, req.user);
    if (token) setAuthCookie(res, token);
    return res.status(status).json(body);
};