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
    const code = '123456';

    const order = new Order({
        type, restaurant, customer, code, items, total
    });
    return order;
}