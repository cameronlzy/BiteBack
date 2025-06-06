const customerService = require('../services/customer.service');
const authServices = require('../services/auth.service');
const { validateCustomer, validatePatch } = require('../validators/customerProfile.validator');
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
    // validate request
    const { error } = validatePatch(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const { token, body, status } = await customerService.updateMe(req.body, req.user);
    if (token) setAuthCookie(res, token);
    return res.status(status).json(body);
};

exports.deleteMe = async (req, res) => {
    const credentials = {
        username: req.user.username,
        password: req.body.password
    };
    // verify password
    const authResult = await authServices.verifyUserCredentials(credentials)
    if (authResult.status !== 200) {
        return res.status(authResult.status).json(authResult.body);
    }

    // delete customer
    const { status, body } = await customerService.deleteMe(authResult.body);
    return res.status(status).json(body);
}
