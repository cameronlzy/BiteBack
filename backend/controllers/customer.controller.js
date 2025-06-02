const customerService = require('../services/customer.service');
const { validateCustomer } = require('../validators/customerProfile.validator');
const setAuthCookie = require('../helpers/setAuthCookie');

exports.getMe = async (req, res) => {
    const { status, body } = await customerService.getMe(req.user._id);
    return res.status(status).json(body);
};

exports.publicProfile = async (req, res) => {
    const { status, body } = await customerService.publicProfile(req.params.id);
    return res.status(status).json(body);
};

exports.updateMe = async (req, res) => {
    req.body.role = 'customer';
    // validate request change validation for patch
    const { error } = validateCustomer(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const { token, body, status } = await customerService.updateMe(req.body, req.user);
    if (token) setAuthCookie(res, token);
    return res.status(status).json(body);
};
