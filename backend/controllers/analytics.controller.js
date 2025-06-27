import * as analyticsService from '../services/analytics.service.js';
import { validateSummaryQuery, validateTrendsQuery } from '../validators/analytics.validator.js';
import { wrapError } from '../helpers/response.js';

export async function getSnapshot(req, res) {
    const { status, body } = await analyticsService.getSnapshot(req.restaurant);
    return res.status(status).json(body);
}

export async function getSummary(req, res) {
    const { error } = validateSummaryQuery(req.query);
    if (error) return res.status(400).json(wrapError(error.details[0].message));

    const { unit, amount, date } = req.query;

    const query = {
        unit: unit || null,
        amount: amount ? parseInt(amount) : 1,
        date: date || null,
    };

    const { status, body } = await analyticsService.getSummary(req.restaurant, query);
    return res.status(status).json(body);
}

export async function getTrends(req, res) {
    const { error } = validateTrendsQuery(req.query);
    if (error) return res.status(400).json(wrapError(error.details[0].message));

    const days = req.query.days ? parseInt(req.query.days) : 1;

    const { status, body } = await analyticsService.getTrends(req.restaurant, days);
    return res.status(status).json(body);
}
