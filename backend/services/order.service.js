import _ from 'lodash';
import mongoose from 'mongoose';
import { DateTime } from 'luxon';
import Order from '../models/order.model.js';
import MenuItem from '../models/menuItem.model.js';
import Restaurant from '../models/restaurant.model.js';
import CustomerProfile from '../models/customerProfile.model.js';
import { success, error } from '../helpers/response.js';

export async function getOrdersByCustomer(authUser, query) {
    const { page, limit, restaurantId } = query;
    const skip = (page - 1) * limit;

    const customer = await CustomerProfile.exists({ _id: authUser.profile });
    if (!customer) return error(404, 'Customer profile not found');

    const filter = { customer: authUser.profile };
    if (restaurantId) filter.restaurant = restaurantId;

    const [orders, total] = await Promise.all([
        Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        Order.countDocuments(filter),
    ]);

    return success({
        orders,
        page,
        limit,
        totalCount: total,
        totalPages: Math.ceil(total / limit)
    });
}

export async function getOrderByCode(staff, code) {
    const order = await Order.findOne({ code, restaurant: staff.restaurant }).lean();
    if (!order) return error(404, 'Order with given code not found');

    return success(order);
}

export async function getOrderByCustomer(staff, customerId) {
    const cutoff = DateTime.utc().minus({ hours: 1 }).toJSDate();

    const order = await Order.findOne({
        restaurant: staff.restaurant,
        customer: customerId,
        status: 'pending',
        createdAt: { $gte: cutoff },
    }).sort({ createdAt: -1 }).lean();

    return success(order);
}

export async function getOrdersByRestaurant(restaurant, query) {
    const orders = await Order.find({ restaurant: restaurant._id, status: query.status }).lean();
    return success(orders);
}

export async function createOrder(authUser, data) {
    const restaurant = await Restaurant.findById(data.restaurant).select('preordersEnabled').lean();
    if (!restaurant) return error(404, 'Restaurant not found');
    if (!restaurant.preordersEnabled) return error(400, 'Preorders are currently disabled for this restaurant');

    const order = new Order(_.pick(data, ['type', 'restaurant']));
    order.customer = authUser.profile;

    const itemIds = data.items.map(i => i.item);
    const menuItems = await MenuItem.find({ _id: { $in: itemIds } }).lean();
    const menuItemMap = Object.fromEntries(menuItems.map(item => [item._id.toString(), item]));
    
    const itemSnapshot = [];
    let total = 0;

    for (const { item: itemId, quantity, remarks } of data.items) {
        const menuItem = menuItemMap[itemId.toString()];
        if (!menuItem) return error(404, `MenuItem not found: ${itemId}`);

        itemSnapshot.push({
            item: menuItem._id,
            name: menuItem.name,
            price: menuItem.price,
            quantity,
            ...(remarks ? { remarks } : {})
        });

        total += menuItem.price * quantity;
    }
    order.items = itemSnapshot;
    order.total = total;
    order.code = await generateOrderCode(data.restaurant);
    await order.save();
    
    return success(order);
}

export async function addTableNumber(order, data) {
    order.tableNumber = data.tableNumber;
    order.status = 'preparing';
    await order.save();
    return success(data);
}

export async function updateStatus(order, data) {
    order.status = data.status;
    if (data.status === 'completed') order.code = undefined;
    await order.save();
    return success(data);
}

export async function updateOrder(order, update) {
    if (order.status !== 'pending') return error(400, 'Order cannot be modified');

    const itemMap = new Map(order.items.map(i => [i._id.toString(), i]));

    if (Array.isArray(update.remove)) {
        for (const entryId of update.remove) {
            itemMap.delete(entryId.toString());
        }
    }

    if (Array.isArray(update.update)) {
        for (const { _id, quantity, remarks } of update.update) {
            const entry = itemMap.get(_id.toString());
            if (!entry) return error(404, `Item not found in order: ${_id}`);
            if (quantity !== undefined) entry.quantity = quantity;
            if (remarks !== undefined) entry.remarks = remarks;
        }
    }

    if (Array.isArray(update.add)) {
        const newItemIds = update.add.map(i => i.item);
        const menuItems = await MenuItem.find({ _id: { $in: newItemIds } }).lean();
        const menuMap = Object.fromEntries(menuItems.map(i => [i._id.toString(), i]));

        for (const { item, quantity, remarks } of update.add) {
            const menuItemId = item.toString();

            const menuItem = menuMap[menuItemId];
            if (!menuItem) return error(404, `MenuItem not found: ${menuItemId}`);

            const newEntryId = new mongoose.Types.ObjectId();
            const newEntry = {
                _id: newEntryId,
                item: menuItem._id,
                name: menuItem.name,
                price: menuItem.price,
                quantity,
                ...(remarks !== undefined ? { remarks } : {})
            };

            itemMap.set(newEntryId.toString(), newEntry);
        }
    }

    const newItems = Array.from(itemMap.values());
    if (newItems.length === 0) return error(400, 'Order must contain at least one item');

    order.items = newItems;
    order.total = newItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    await order.save();

    return success(order);
}

// helper services
async function generateOrderCode(restaurant) {
    let code;
    let exists = true;

    while (exists) {
        code = Math.floor(100000 + Math.random() * 900000).toString();
        exists = await Order.exists({ code, restaurant });
    }
    return code;
}

