const Restaurant = require('../../models/restaurant.model');
const { convertSGTOpeningHoursToUTC } = require('../../helpers/restaurant.helper');
const mongoose = require('mongoose');

function createTestRestaurant(owner) {
    let restaurantName = "restaurant";
    let address = "new york";
    let contactNumber = "87654321";
    let cuisines = ["Chinese"];
    let openingHours = {
        monday: "09:00-17:00",
        tuesday: "09:00-17:00",
        wednesday: "09:00-17:00",
        thursday: "09:00-17:00",
        friday: "09:00-17:00",
        saturday: "10:00-14:00",
        sunday: "Closed"
    };
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