import * as rewardsShopService from '../services/rewardsShop.service.js';
import { validateItem, validatePatch } from '../validators/rewardsShop.validator.js';
import validatePagination from '../validators/pagination.validator.js';
import { wrapError } from '../helpers/response.js';

export async function getAllItems(req, res) {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 8);
    const query = { page, limit };

    const { error } = validatePagination(query);
    if (error) return res.status(400).json(wrapError(error.details[0].message));

    const { status, body } = await rewardsShopService.getAllItems(req.params.id, query);
    return res.status(status).json(body);
}

export async function getItemById(req, res) {
    const { status, body } = await rewardsShopService.getItemById(req.params.id);
    return res.status(status).json(body);
}

export async function createItem(req, res) {
    const { error } = validateItem(req.body);
    if (error) return res.status(400).json(wrapError(error.details[0].message));

    const { status, body } = await rewardsShopService.createItem(req.body, req.restaurant);
    return res.status(status).json(body);
}

export async function updateItem(req, res) {
    const { error } = validatePatch(req.body);
    if (error) return res.status(400).json(wrapError(error.details[0].message));

    const { status, body } = await rewardsShopService.updateItem(req.body, req.rewardItem);
    return res.status(status).json(body);
}

export async function deleteItem(req, res) {
    const { status, body } = await rewardsShopService.deleteItem(req.rewardItem);
    return res.status(status).json(body);
}