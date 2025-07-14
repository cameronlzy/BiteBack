import Restaurant from '../../models/restaurant.model.js';
import { convertOpeningHoursToUTC } from '../../helpers/restaurant.helper.js';
import mongoose from 'mongoose';

export function createTestRestaurant(owner = new mongoose.Types.ObjectId()) {
    let restaurantName = "restaurant";
    let address = "Blk 30 Kelantan Lane #12-01D, S208652";
    let contactNumber = "87654321";
    let cuisines = ["Chinese"];
    let openingHours = "00:00-23:59|19:00-23:00|09:00-17:00|09:00-23:00|09:00-17:00|09:00-18:00|x";
    openingHours = convertOpeningHoursToUTC(openingHours);
    let restaurantEmail = `restaurant@gmail.com`;
    let website = "https://www.restaurant.com";
    let maxCapacity = 50;
    let location = { type: 'Point', coordinates: [103.856895, 1.306698]};
    let tags = ['Live Music'];
    return new Restaurant({
        owner,
        name: restaurantName,
        address,
        contactNumber,
        cuisines,
        openingHours,
        maxCapacity,
        email: restaurantEmail,
        website, location, tags
    });
}