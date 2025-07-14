import * as rewardPointService from '../services/rewardPoint.service.js';
import { validatePointsUpdate } from '../validators/rewardPoint.validator.js';
import validatePagination from '../validators/pagination.validator.js';
import { wrapError } from '../helpers/response.js';

export async function getAllPoints(req, res) {
    const { error, value } = validatePagination(req.query);
    if (error) return res.status(400).json(wrapError(error.details[0].message));

    const { status, body } = await rewardPointService.getAllPoints(req.user, value);
    return res.status(status).json(body);
}

export async function getPointByRestaurant(req, res) {
    const { status, body } = await rewardPointService.getPointByRestaurant(req.user, req.params.id);
    return res.status(status).json(body);
}

export async function updatePoints(req, res) {
    const { error, value } = validatePointsUpdate(req.body);
    if (error) return res.status(400).json(wrapError(error.details[0].message));

    const { status, body } = await rewardPointService.updatePoints(req.restaurant, value);
    return res.status(status).json(body);
}