import * as menuService from '../services/menu.service.js';
import MenuItem from '../models/menuItem.model.js';
import { validateItem, validatePatch } from '../validators/menu.validator.js';
import { addImage, deleteImagesFromDocument } from '../services/image.service.js';
import validatePagination from '../validators/pagination.validator.js';
import { wrapError } from '../helpers/response.js';

export async function getAllItems(req, res) {
    const { error, value } = validatePagination(req.query);
    if (error) return res.status(400).json(wrapError(error.details[0].message));

    const { status, body } = await menuService.getAllItems(req.params.id, value);
    return res.status(status).json(body);
}

export async function getItemById(req, res) {
    const { status, body } = await menuService.getItemById(req.params.id);
    return res.status(status).json(body);
}

export async function createItem(req, res) {
    const { error, value } = validateItem(req.body);
    if (error) return res.status(400).json(wrapError(error.details[0].message));

    const { status, body } = await menuService.createItem(value);
    return res.status(status).json(body);
}

export async function addItemImage(req, res) {
    const { status, body } = await addImage(MenuItem, req.menuItem._id, req.file, 'image');
    return res.status(status).json({ image: body.image });
}

export async function updateItemImage(req, res) {
    const image = req.file;
    if (!image) return res.status(400).json(wrapError('Please provide an image'));
    
    const item = req.menuItem;
    if (item.image) await deleteImagesFromDocument(item, 'image');
    
    const { status, body } = await addImage(MenuItem, item._id, image, 'image');
    return res.status(status).json({ image: body.image });
}

export async function updateItem(req, res) {
    const { error, value } = validatePatch(req.body);
    if (error) return res.status(400).json(wrapError(error.details[0].message));

    const { status, body } = await menuService.updateItem(value, req.menuItem);
    return res.status(status).json(body);
}

export async function deleteItem(req, res) {
    const { status, body } = await menuService.deleteItem(req.menuItem);
    return res.status(status).json(body);
}