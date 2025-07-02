import * as rewardsPointsService from '../services/rewardsPoints.service.js';
import { validatePointsUpdate } from '../validators/rewardsPoints.validator.js';
import validatePagination from '../validators/pagination.validator.js';
import { wrapError } from '../helpers/response.js';

export async function getAllPoints(req, res) {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 8);
    const query = { page, limit };

    const { error } = validatePagination(query);
    if (error) return res.status(400).json(wrapError(error.details[0].message));

    const { status, body } = await rewardsPointsService.getAllPoints(req.user, query);
    return res.status(status).json(body);
}

export async function getPointByRestaurant(req, res) {
    const { status, body } = await rewardsPointsService.getPointByRestaurant(req.user, req.params.id);
    return res.status(status).json(body);
}

export async function updatePoints(req, res) {
    const { error } = validatePointsUpdate(req.body);
    if (error) return res.status(400).json(wrapError(error.details[0].message));

    const { status, body } = await rewardsPointsService.updatePoints(req.restaurant, req.body);
    return res.status(status).json(body);
}