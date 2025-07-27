import * as customerService from '../services/customer.service.js';
import * as authService from '../services/auth.service.js';
import { validateCustomer, validatePatch } from '../validators/customerProfile.validator.js';
import { setAuthCookie } from '../helpers/cookie.helper.js';
import { wrapError } from '../helpers/response.js';

export async function getMe(req, res) {
    const { status, body } = await customerService.getMe(req.user._id);
    return res.status(status).json(body);
};

export async function publicProfile(req, res) {
    const { status, body } = await customerService.publicProfile(req.params.id);
    return res.status(status).json(body);
};

export async function createProfile(req, res) {
    const { error, value } = validateCustomer(req.body);
    if (error) return res.status(400).json(wrapError(error.details[0].message));

    const { token, status, body } = await customerService.createProfile(req.user, value);
    if (token) setAuthCookie(res, token);
    return res.status(status).json(body);
};

export async function updateMe(req, res) {
    // validate request
    const { error, value } = validatePatch(req.body);
    if (error) return res.status(400).json(wrapError(error.details[0].message));

    const { token, body, status } = await customerService.updateMe(value, req.user);
    if (token) setAuthCookie(res, token);
    return res.status(status).json(body);
};

export async function deleteMe(req, res) {
    const credentials = {
        username: req.user.username,
        password: req.body.password
    };
    // verify password
    const authResult = await authService.verifyUserCredentials(credentials)
    if (authResult.status !== 200) {
        return res.status(authResult.status).json(authResult.body);
    }

    // delete customer
    const { status, body } = await customerService.deleteMe(authResult.body);
    return res.status(status).json(body);
}
