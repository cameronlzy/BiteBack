const Restaurant = require('../../models/restaurant.model');
const { convertSGTOpeningHoursToUTC } = require('../../helpers/restaurant.helper');
const mongoose = require('mongoose');

function createTestRestaurant(owner) {
    let restaurantName = "restaurant";
    let address = "new york";
    let contactNumber = "87654321";
    let cuisines = ["Chinese"];
    let openingHours = "09:00-17:00|09:00-17:00|09:00-17:00|09:00-17:00|09:00-17:00|10:00-14:00|x";
    openingHours = convertSGTOpeningHoursToUTC(openingHours);
    let restaurantEmail = `restaurant@gmail.com`;
    let website = "https://www.restaurant.com";
    let maxCapacity = 50;
    return new Restaurant({
        owner,
        name: restaurantName,
        address,
        contactNumber,
        cuisines,
        openingHours,
        maxCapacity,
        email: restaurantEmail,
        website
    });
}

module.exports = { createTestRestaurant };