import mongoose from 'mongoose';
import MenuItem from '../../models/menuItem.model';

export function createTestMenuItem(restaurant = new mongoose.Types.ObjectId()) {
    const category = 'percentage';
    const description = 'description';
    const price = 100;
    const name = 'name';

    const menuItem = new MenuItem({
        restaurant, category, description, name, price
    });
    return menuItem;
}