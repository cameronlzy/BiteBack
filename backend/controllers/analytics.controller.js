import * as analyticsService from '../services/analytics.service.js';
import { validateSummaryQuery, validateTrendsQuery } from '../validators/analytics.validator.js';
import { wrapError } from '../helpers/response.js';

export async function getSnapshot(req, res) {
    const { status, body } = await analyticsService.getSnapshot(req.restaurant);
    return res.status(status).json(body);
}

export async function getSummary(req, res) {
    const { error, value } = validateSummaryQuery(req.query);
    if (error) return res.status(400).json(wrapError(error.details[0].message));

    const { status, body } = await analyticsService.getSummary(req.restaurant, value);
    return res.status(status).json(body);
}

export async function getTrends(req, res) {
    const { error, value } = validateTrendsQuery(req.query);
    if (error) return res.status(400).json(wrapError(error.details[0].message));

    const { status, body } = await analyticsService.getTrends(req.restaurant, value.days);
    return res.status(status).json(body);
}
