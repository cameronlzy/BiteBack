import Order from '../models/order.model.js';
import { wrapError } from '../helpers/response.js';

export default async function (req, res, next) {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json(wrapError('Order not found'));
    if (order.customer.toString() !== req.user.profile) return res.status(403).json(wrapError('Order does not belong to customer'));

    req.order = order;
    next();
}