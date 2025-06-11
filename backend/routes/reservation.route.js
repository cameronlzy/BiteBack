const auth = require('../middleware/auth');
const validateObjectId = require('../middleware/validateObjectId');
const isStaff = require('../middleware/isStaff');
const authorizedReservationUser = require('../middleware/authorizedReservationUser');
const authorizedRestaurantStaff = require('../middleware/authorizedRestaurantStaff');
const reservationController = require('../controllers/reservation.controller');
const express = require('express');
const wrapRoutes = require('../helpers/wrapRoutes');
const router = wrapRoutes(express.Router());

// [Staff] - Get reservations at restaurant for current timeslot
router.get('/restaurant/:id', [validateObjectId, auth, isStaff, authorizedRestaurantStaff], reservationController.getReservationsByRestaurant);

// [User] - Get all of user's reservations
router.get('/', auth, reservationController.getUserReservations);

// [User] - Get user's individual reservation
router.get('/:id', [validateObjectId, auth, authorizedReservationUser], reservationController.getSingleReservation);

// [User] - Create reservation
router.post('/', auth, reservationController.createReservation);

// [User] - Update reservation
router.patch('/:id', [validateObjectId, auth, authorizedReservationUser], reservationController.updateReservation);

// [User] - Delete reservation
router.delete('/:id', [validateObjectId, auth, authorizedReservationUser], reservationController.deleteReservation);

module.exports = router; 