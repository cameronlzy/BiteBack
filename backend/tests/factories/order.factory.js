import Order from '../../models/order.model.js';
import mongoose from 'mongoose';

export function createTestOrder({
    restaurant = new mongoose.Types.ObjectId(),
    customer = new mongoose.Types.ObjectId(),
    items = [{
        item: new mongoose.Types.ObjectId(),
        name: 'name',
        price: 10,
        quantity: 1,
    }]
} = {}) {
    const type = 'preorder';
    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    const order = new Order({
        type, restaurant, customer, code, items, total
    });
    return order;
}