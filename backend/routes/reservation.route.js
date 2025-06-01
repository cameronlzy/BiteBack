const auth = require('../middleware/auth');
const validateObjectId = require('../middleware/validateObjectId');
const isOwner = require('../middleware/isOwner');
const authorizedReservationUser = require('../middleware/authorizedReservationUser');
const authorizedRestaurantOwner = require('../middleware/authorizedRestaurantOwner');
const reservationController = require('../controllers/reservation.controller');
const express = require('express');
const wrapRoutes = require('../helpers/wrapRoutes');
const router = wrapRoutes(express.Router());

// [Owner] - Get all reservations in all restaurants owned by owner
router.get('/owner', [auth, isOwner], reservationController.getReservationsByOwner);

// [Owner] - Get all reservations in a restaurant
router.get('/restaurant/:id', [validateObjectId, auth, isOwner, authorizedRestaurantOwner], reservationController.getReservationsByRestaurant);

// [User] - Get all of user's reservations
router.get('/', auth, reservationController.getUserReservations);

// [User] - Get user's individual reservation
router.get('/:id', [validateObjectId, auth, authorizedReservationUser], reservationController.getSingleReservation);

// [User] - Create reservation
router.post('/', auth, reservationController.createReservation);

// [User] - Update reservation
router.put('/:id', [validateObjectId, auth, authorizedReservationUser], reservationController.updateReservation);

// [User] - Delete reservation
router.delete('/:id', [validateObjectId, auth, authorizedReservationUser], reservationController.deleteReservation);

module.exports = router; 