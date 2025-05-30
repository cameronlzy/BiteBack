const auth = require('../middleware/auth');
const express = require('express');
const restaurantController = require('../controllers/restaurant.controller');
const validateObjectId = require('../middleware/validateObjectId');
const isOwner = require('../middleware/isOwner');
const wrapRoutes = require('../helpers/wrapRoutes');
const router = wrapRoutes(express.Router());

const isProdEnv = process.env.NODE_ENV === 'production';

router.get('/', restaurantController.getAllRestaurants);

router.get('/:id', validateObjectId, restaurantController.getRestaurantById);

router.get('/:id/availability', [auth, validateObjectId], restaurantController.getAvailability);

router.post('/', [auth, isOwner], restaurantController.createRestaurant);

router.put('/:id', [auth, isOwner, validateObjectId], restaurantController.updateRestaurant);

router.delete('/:id', [auth, isOwner, validateObjectId], restaurantController.deleteRestaurant);

module.exports = router; 