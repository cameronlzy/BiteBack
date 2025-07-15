import * as orderService from '../services/order.service.js';
import { validateHistory, validateCode, validateOrder, validatePatch } from '../validators/order.validator.js';
import { wrapError } from '../helpers/response.js';

export async function getOrdersByCustomer(req, res) {
    const { error, value } = validateHistory(req.query);
    if (error) return res.status(400).json(wrapError(error.details[0].message));

    const { status, body } = await orderService.getOrdersByCustomer(req.user, value);
    return res.status(status).json(body);
}

export async function getOrderByCode(req, res) {
    const { error, value } = validateCode(req.params);
    if (error) return res.status(400).json(wrapError(error.details[0].message));

    const { status, body } = await orderService.getOrderByCode(req.user, value.code);
    return res.status(status).json(body);
}

export async function getOrderById(req, res) {
    return res.status(200).json(req.order);
}

export async function createOrder(req, res) {
    const { error, value } = validateOrder(req.body);
    if (error) return res.status(400).json(wrapError(error.details[0].message));

    const { status, body } = await orderService.createOrder(req.user, value);
    return res.status(status).json(body);
}

export async function updateOrder(req, res) {
    const { error, value } = validatePatch(req.body);
    if (error) return res.status(400).json(wrapError(error.details[0].message));

    const { status, body } = await orderService.updateOrder(req.user, req.order, value);
    return res.status(status).json(body);
}
