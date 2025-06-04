const auth = require('../middleware/auth');
const isOwner = require('../middleware/isOwner');
const authorizedRestaurantOwner = require('../middleware/authorizedRestaurantOwner');
const parser = require('../middleware/cloudinaryUpload');
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

// [Owner] - Upload images for their restaurant (only 1 image for now)
router.post('/:id/images', [auth, isOwner, parser.array('images', 5)], restaurantController.addImagesToRestaurant);

// [Owner] - Update restaurant
router.patch('/:id', [validateObjectId, auth, isOwner, authorizedRestaurantOwner], restaurantController.updateRestaurant);

// [Owner] - Delete restaurant
router.delete('/:id', [validateObjectId, auth, isOwner, authorizedRestaurantOwner], restaurantController.deleteRestaurant);

module.exports = router; 