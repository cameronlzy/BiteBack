const auth = require('../middleware/auth');
const validateObjectId = require('../middleware/validateObjectId');
const isOwner = require('../middleware/isOwner');
const reservationController = require('../controllers/reservation.controller');
const express = require('express');
const wrapRoutes = require('../helpers/wrapRoutes');
const router = wrapRoutes(express.Router());

router.get('/owner', [auth, isOwner], reservationController.getReservationsByOwner);

router.get('/restaurant/:id', [auth, isOwner, validateObjectId], reservationController.getReservationsByRestaurant);

router.get('/', auth, reservationController.getUserReservations);

router.get('/:id', [auth, validateObjectId], reservationController.getSingleReservation);

router.post('/', auth, reservationController.createReservation);

router.put('/:id', [auth, validateObjectId], reservationController.updateReservation);

router.delete('/:id', [auth, validateObjectId], reservationController.deleteReservation);

module.exports = router; 