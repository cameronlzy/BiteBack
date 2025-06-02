const auth = require('../middleware/auth');
const isOwner = require('../middleware/isOwner');
const authorizedRestaurantOwner = require('../middleware/authorizedRestaurantOwner');
const express = require('express');
const restaurantController = require('../controllers/restaurant.controller');
const validateObjectId = require('../middleware/validateObjectId');
const wrapRoutes = require('../helpers/wrapRoutes');
const router = wrapRoutes(express.Router());

// [Public] - Get all restaurants
router.get('/', restaurantController.getAllRestaurants);

// [Public] - Get restaurant by ID
router.get('/:id', validateObjectId, restaurantController.getRestaurantById);

// [Public] - Get availability of restaurant by date
router.get('/:id/availability', validateObjectId, restaurantController.getAvailability);

// [Owner] - Create new restaurant
router.post('/', [auth, isOwner], restaurantController.createRestaurant);

// [Onwer] - Upload images for their restaurant
// router.post('/:id/images', [auth, isOwner], restaurantController.uploadImageToRestaurant);

// [Owner] - Update restaurant
router.put('/:id', [validateObjectId, auth, isOwner, authorizedRestaurantOwner], restaurantController.updateRestaurant);

// [Owner] - Delete restaurant
router.delete('/:id', [validateObjectId, auth, isOwner, authorizedRestaurantOwner], restaurantController.deleteRestaurant);

module.exports = router; 