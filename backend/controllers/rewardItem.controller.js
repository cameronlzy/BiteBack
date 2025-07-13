import * as rewardItemService from '../services/rewardItem.service.js';
import { validateItem, validatePatch } from '../validators/rewardItem.validator.js';
import validatePagination from '../validators/pagination.validator.js';
import { wrapError } from '../helpers/response.js';

export async function getAllItems(req, res) {
    const { error, value } = validatePagination(req.query);
    if (error) return res.status(400).json(wrapError(error.details[0].message));

    const { status, body } = await rewardItemService.getAllItems(req.params.id, value);
    return res.status(status).json(body);
}

export async function getItemById(req, res) {
    const { status, body } = await rewardItemService.getItemById(req.params.id);
    return res.status(status).json(body);
}

export async function createItem(req, res) {
    const { error, value } = validateItem(req.body);
    if (error) return res.status(400).json(wrapError(error.details[0].message));

    const { status, body } = await rewardItemService.createItem(value, req.restaurant);
    return res.status(status).json(body);
}

export async function updateItem(req, res) {
    const { error, value } = validatePatch(req.body);
    if (error) return res.status(400).json(wrapError(error.details[0].message));

    const { status, body } = await rewardItemService.updateItem(value, req.rewardItem);
    return res.status(status).json(body);
}

export async function deleteItem(req, res) {
    const { status, body } = await rewardItemService.deleteItem(req.rewardItem);
    return res.status(status).json(body);
}