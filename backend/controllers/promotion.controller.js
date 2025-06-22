import * as promotionService from '../services/promotion.service.js';
import { validateSearch } from '../validators/promotion.validator.js';

export async function searchPromotions(req, res) {
    const { error } = validateSearch(req.query);
    if (error) return res.status(400).send(error.details[0].message);

    const { search, restaurants, page, limit, sortBy, order } = req.query;

    const filters = {
        search: search || null,
        restaurants: restaurants ? restaurants.split(',') : null,
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit): 8,
        sortBy: sortBy ? sortBy : 'endDate',
        order: order === 'desc' ? 'desc' : 'asc',
    };

    const { status, body } = await promotionService.searchPromotions(filters);
    return res.status(status).json(body);
};