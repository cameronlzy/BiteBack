const Restaurant = require('../../models/restaurant.model');
const { convertSGTOpeningHoursToUTC } = require('../../helpers/restaurant.helper');
const mongoose = require('mongoose');

function createTestRestaurant(owner) {
    let restaurantName = "restaurant";
    let address = "Blk 30 Kelantan Lane #12-01D, S208652";
    let contactNumber = "87654321";
    let cuisines = ["Chinese"];
    let openingHours = "09:00-17:00|09:00-17:00|09:00-17:00|09:00-17:00|09:00-17:00|10:00-14:00|x";
    openingHours = convertSGTOpeningHoursToUTC(openingHours);
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

module.exports = { createTestRestaurant };