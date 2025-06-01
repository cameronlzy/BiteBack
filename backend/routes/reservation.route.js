const auth = require('../middleware/auth');
const validateObjectId = require('../middleware/validateObjectId');
const isOwner = require('../middleware/isOwner');
const reservationController = require('../controllers/reservation.controller');
const express = require('express');
const wrapRoutes = require('../helpers/wrapRoutes');
const router = wrapRoutes(express.Router());

// [Owner] - Get all reservations in all restaurants owned by owner
router.get('/owner', [auth, isOwner], reservationController.getReservationsByOwner);

// [Owner] - Get all reservations in a restaurant // add rest to owner
router.get('/restaurant/:id', [auth, isOwner, validateObjectId], reservationController.getReservationsByRestaurant);

// [User] - Get all of user's reservations // add reservation to user
router.get('/', auth, reservationController.getUserReservations);

// [User] - Get user's individual reservation 
router.get('/:id', [auth, validateObjectId], reservationController.getSingleReservation);

// [User] - Create reservation
router.post('/', auth, reservationController.createReservation);

// [User] - Update reservation // add reservation to user
router.put('/:id', [auth, validateObjectId], reservationController.updateReservation);

// [User] - Delete reservation // add reservation to user
router.delete('/:id', [auth, validateObjectId], reservationController.deleteReservation);

module.exports = router; 