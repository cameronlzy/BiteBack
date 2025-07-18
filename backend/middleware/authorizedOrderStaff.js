import Order from '../models/order.model.js';
import { wrapError } from '../helpers/response.js';

export default async function (req, res, next) {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json(wrapError('Order not found'));
    if (order.restaurant.toString() !== req.user.restaurant) return res.status(403).json(wrapError('Staff cannot access order'));

    req.order = order;
    next();
}