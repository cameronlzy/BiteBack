import _ from 'lodash';
import { error, success, wrapMessage } from '../helpers/response.js';
import MenuItem from '../models/menuItem.model.js';
import Restaurant from '../models/restaurant.model.js';

export async function getAllItems(restaurantId, authUser) {
    const restaurant = await Restaurant.findById(restaurantId).select('_id owner').lean();
    if (!restaurant) return error(404, 'Restaurant not found');
    const isOwner = authUser?.role === 'owner' && authUser?.profile?.toString() === restaurant.owner.toString();

    const filter = { restaurant: restaurantId };
    if (!isOwner) {
        filter.isAvailable = true;
    }

    const items = await MenuItem.find(filter).sort({ category: 1, name: 1 }).lean();
    return success(items);
}

export async function getItemById(itemId) {
    const item = await MenuItem.findById(itemId).lean();
    if (!item) return error(404, 'Item not found');
    return success(item);
}

export async function createItem(data) {
    const restaurant = await Restaurant.exists({ _id: data.restaurant });
    if (!restaurant) return error(404, 'Restaurant not found');

    const menuItem = new MenuItem(_.pick(data, ['restaurant', 'name', 'description', 'price', 'category']));
    await menuItem.save();

    return success(menuItem);
}

export async function toggleInStock(data, menuItem) {
    menuItem.isInStock = data.isInStock;
    await menuItem.save();
    return success(data);
}

export async function updateItem(update, menuItem) {
    for (const key in update) {
        if (update[key] !== undefined) {
            menuItem[key] = update[key];
        }
    }
    await menuItem.save();
    return success(menuItem.toObject());
}

export async function deleteItem(menuItem) {
    await menuItem.deleteOne();
    return success(wrapMessage('Menu Item deleted successfully'));
}