const auth = require('../middleware/auth');
const express = require('express');
const restaurantController = require('../controllers/restaurant.controller');
const validateObjectId = require('../middleware/validateObjectId');
const isOwner = require('../middleware/isOwner');
const wrapRoutes = require('../helpers/wrapRoutes');
const router = wrapRoutes(express.Router());

// [Public] - Get all restaurants
router.get('/', restaurantController.getAllRestaurants);

// [Public] - Get restaurant by ID
router.get('/:id', validateObjectId, restaurantController.getRestaurantById);

// [Public] - Get availability of restaurant by date
router.get('/:id/availability', [auth, validateObjectId], restaurantController.getAvailability);

// [Owner] - Create new restaurant
router.post('/', [auth, isOwner], restaurantController.createRestaurant);

// [Onwer] - Upload images for their restaurant
// router.post('/:id/images', [auth, isOwner], restaurantController.uploadImageToRestaurant);

// [Owner] - Update restaurant
router.put('/:id', [auth, isOwner, validateObjectId], restaurantController.updateRestaurant);

// [Owner] - Delete restaurant
router.delete('/:id', [auth, isOwner, validateObjectId], restaurantController.deleteRestaurant);

module.exports = router; 