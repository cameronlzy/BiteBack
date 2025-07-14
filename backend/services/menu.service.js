import _ from 'lodash';
import { error, success } from '../helpers/response.js';
import MenuItem from '../models/menuItem.model.js';
import Restaurant from '../models/restaurant.model.js';

export async function getAllItems(restaurant, query) {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
        MenuItem.find({ restaurant, isAvailable: true }).sort({ category : 1 }).skip(skip).limit(limit).lean(),
        MenuItem.countDocuments({ restaurant, isAvailable: true }),
    ]);

    return success({
        items,
        page,
        limit,
        totalCount: total,
        totalPages: Math.ceil(total / limit)
    });
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
    const deletedItem = menuItem.toObject();
    await menuItem.deleteOne();
    return success(deletedItem);
}