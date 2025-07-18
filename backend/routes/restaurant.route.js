import express from 'express';
import auth from '../middleware/auth.js';
import isOwner from '../middleware/isOwner.js';
import isStaff from '../middleware/isStaff.js';
import authorizedRestaurantOwner from '../middleware/authorizedRestaurantOwner.js';
import authorizedRestaurantStaff from '../middleware/authorizedRestaurantStaff.js';
import parser from '../middleware/cloudinaryUpload.js';
import * as restaurantController from '../controllers/restaurant.controller.js';
import validateObjectId from '../middleware/validateObjectId.js';
import wrapRoutes from '../helpers/wrapRoutes.js';
import isCustomer from '../middleware/isCustomer.js';

const router = wrapRoutes(express.Router());

const restaurantParser = parser('restaurants');

// [Public] - Search route with filters
router.get('/', restaurantController.searchRestaurants);

// [Public] - Discovery route
router.get('/discover', restaurantController.discoverRestaurants);

// [Public] - Get restaurant by ID
router.get('/:id', [validateObjectId()], restaurantController.getRestaurantById);

// [Public] - Get availability of restaurant by date
router.get('/:id/availability', [validateObjectId()], restaurantController.getAvailability);

// [Customer] - Get customer's number of visits to restaurant
router.get('/:id/visits', [validateObjectId(), auth, isCustomer], restaurantController.getVisitCount);

// [Staff] - Get reservations at restaurant for current timeslot
router.get('/:id/reservations', [validateObjectId(), auth, isStaff, authorizedRestaurantStaff], restaurantController.getReservationsByRestaurant);

// [Owner] - Create new restaurant
router.post('/', [auth, isOwner], restaurantController.createRestaurant);

// [Owner] - Create multiple restaurants (for registration)
router.post('/bulk', [auth, isOwner], restaurantController.createRestaurantBulk);

// [Owner] - Upload images for their restaurant
router.post('/:id/images', [validateObjectId(), auth, isOwner, authorizedRestaurantOwner, restaurantParser.array('images', 5)], restaurantController.addRestaurantImages);

// [Owner] - Reorder/Delete images from restaurant
router.put('/:id/images', [validateObjectId(), auth, isOwner, authorizedRestaurantOwner], restaurantController.updateRestaurantImages);

// [Owner] - Toggle restaurant preorders
router.patch('/:id/preorders-enabled', [validateObjectId(), auth, isOwner, authorizedRestaurantOwner], restaurantController.togglePreorders);

// [Owner] - Update restaurant
router.patch('/:id', [validateObjectId(), auth, isOwner, authorizedRestaurantOwner], restaurantController.updateRestaurant);

// [Owner] - Delete restaurant
router.delete('/:id', [validateObjectId(), auth, isOwner, authorizedRestaurantOwner], restaurantController.deleteRestaurant);

export default router;