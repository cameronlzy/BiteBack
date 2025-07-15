import _ from 'lodash';
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

    for (const { item: itemId, quantity } of data.items) {
        const menuItem = menuItemMap[itemId.toString()];
        if (!menuItem) return error(404, `MenuItem not found: ${itemId}`);

        itemSnapshot.push({
            item: menuItem._id,
            name: menuItem.name,
            price: menuItem.price,
            quantity
        });

        total += menuItem.price * quantity;
    }
    order.items = itemSnapshot;
    order.total = total;
    order.code = await generateOrderCode(data.restaurant);
    await order.save();
    
    return success(order);
}

export async function updateOrder(authUser, order, update) {
    if (order.status === 'completed') return error(400, 'Order cannot be modified');

    const itemMap = new Map(order.items.map(i => [i.item.toString(), i]));

    if (Array.isArray(update.remove)) {
        for (const itemId of update.remove) {
            itemMap.delete(itemId.toString());
        }
    }

    if (Array.isArray(update.update)) {
        for (const { item, quantity } of update.update) {
            const entry = itemMap.get(item.toString());
            if (!entry) return error(404, `Item not found in order: ${item}`);
            entry.quantity = quantity;
        }
    }

    if (Array.isArray(update.add)) {
        const newItemIds = update.add.map(i => i.item);
        const menuItems = await MenuItem.find({ _id: { $in: newItemIds } }).lean();
        const menuMap = Object.fromEntries(menuItems.map(i => [i._id.toString(), i]));

        for (const { item, quantity } of update.add) {
            const id = item.toString();
            if (itemMap.has(id)) return error(400, `Item already exists in order: ${id}`);
            const menuItem = menuMap[id];
            if (!menuItem) return error(404, `MenuItem not found: ${id}`);

            itemMap.set(id, {
                item: menuItem._id,
                name: menuItem.name,
                price: menuItem.price,
                quantity,
            });
        }
    }

    const newItems = Array.from(itemMap.values());
    if (newItems.length === 0) return error(400, 'Order must contain at least one item');
    const newTotal = newItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

    order.items = newItems;
    order.total = newTotal;
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

