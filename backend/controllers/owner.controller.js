import * as ownerService from '../services/owner.service.js';
import * as authService from '../services/auth.service.js';
import { validatePatch, validatePassword } from '../validators/ownerProfile.validator.js';
import { setAuthCookie } from '../helpers/cookie.helper.js';
import { wrapError } from '../helpers/response.js';

export async function getMe(req, res) {
    const { status, body } = await ownerService.getMe(req.user._id);
    return res.status(status).json(body);
};

export async function getStaffWithStepUp(req, res) {
    const { error, value } = validatePassword(req.body);
    if (error) return res.status(400).json(wrapError(error.details[0].message));

    const { status, body } = await ownerService.getStaffWithStepUp(req.user, value.password);
    return res.status(status).json(body);
};

export async function updateMe(req, res) {
    // validate request
    const { error, value } = validatePatch(req.body);
    if (error) return res.status(400).json(wrapError(error.details[0].message));

    const { token, status, body } = await ownerService.updateMe(value, req.user);
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
    if (authResult.status != 200) {
        return res.status(authResult.status).json(authResult.body);
    }

    const { status, body } = await ownerService.deleteMe(authResult.body);
    return res.status(status).json(body);
};