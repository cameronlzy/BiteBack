import express from 'express';
import auth from '../middleware/auth.js';
import validateObjectId from '../middleware/validateObjectId.js';
import isStaff from '../middleware/isStaff.js';
import authorizedReservationUser from '../middleware/authorizedReservationUser.js';
import authorizedRestaurantStaff from '../middleware/authorizedRestaurantStaff.js';
import authorizedReservationStaff from '../middleware/authorizedReservationStaff.js'
import * as reservationController from '../controllers/reservation.controller.js';
import wrapRoutes from '../helpers/wrapRoutes.js';

const router = wrapRoutes(express.Router());

// [Staff] - Get reservations at restaurant for current timeslot
router.get('/restaurant/:id', [validateObjectId, auth, isStaff, authorizedRestaurantStaff], reservationController.getReservationsByRestaurant);

// [User] - Get all of user's reservations
router.get('/', auth, reservationController.getUserReservations);

// [User] - Get user's individual reservation
router.get('/:id', [validateObjectId, auth, authorizedReservationUser], reservationController.getSingleReservation);

// [User] - Create reservation
router.post('/', auth, reservationController.createReservation);

// [Staff] - Update reservation status
router.patch('/:id/status', [validateObjectId, auth, isStaff, authorizedReservationStaff], reservationController.updateReservationStatus);

// [User] - Update reservation
router.patch('/:id', [validateObjectId, auth, authorizedReservationUser], reservationController.updateReservation);

// [User] - Delete reservation
router.delete('/:id', [validateObjectId, auth, authorizedReservationUser], reservationController.deleteReservation);

export default router;