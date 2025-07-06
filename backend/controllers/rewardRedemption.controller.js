import * as rewardRedemptionService from '../services/rewardRedemption.service.js';
import { wrapError } from '../helpers/response.js';
import { validateHistory, validateRedemption, validateCode } from '../validators/rewardRedemption.validator.js';

export async function getAllRedemptions(req, res) {
    const query = {
        page: Number(req.query.page ?? 1),
        limit: Number(req.query.limit ?? 8),
        status: typeof req.query.status === 'string'
            ? req.query.status.split(',').map(s => s.trim()).filter(Boolean)
            : undefined,
    };

    const { error } = validateHistory(query);
    if (error) return res.status(400).json(wrapError(error.details[0].message));

    const { status: httpStatus, body } = await rewardRedemptionService.getAllRedemptions(req.user, query);
    return res.status(httpStatus).json(body);
}

export async function getRedemptionById(req, res) {
    return res.status(200).json(req.rewardRedemption.toObject());
}

export async function createRedemption(req, res) {
    const { error } = validateRedemption(req.body);
    if (error) return res.status(400).json(wrapError(error.details[0].message));

    const { status, body } = await rewardRedemptionService.createRedemption(req.user, req.body);
    return res.status(status).json(body);
}

export async function completeRedemption(req, res) {
    const { error } = validateCode(req.body);
    if (error) return res.status(400).json(wrapError(error.details[0].message));

    const { status, body } = await rewardRedemptionService.completeRedemption(req.user, req.body.code);
    return res.status(status).json(body);
}

export async function activateRedemption(req, res) {
    const { status, body } = await rewardRedemptionService.activateRedemption(req.rewardRedemption);
    return res.status(status).json(body);
}