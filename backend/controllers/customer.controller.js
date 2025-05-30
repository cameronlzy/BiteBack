const customerService = require('../services/customer.service');
const { validateCustomer } = require('../validators/customerProfile.validator');

exports.getMe = async (req, res) => {
    const data = await customerService.getMe(req.user._id);
    return res.status(data.status).send(data.body);
};

exports.publicProfile = async (req, res) => {
    const data = await customerService.publicProfile(req.params.id);
    return res.status(data.status).send(data.body);
};

exports.updateMe = async (req, res) => {
    req.body.role = 'customer';
    // validate request change validation for patch
    const { error } = validateCustomer(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const data = await customerService.updateMe(req.body, req.user);
    return res.header('x-auth-token', data.token).send(data.body);
};
