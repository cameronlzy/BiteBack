import express from 'express';
import auth from '../middleware/auth.js';
import validateObjectId from '../middleware/validateObjectId.js';
import isCustomer from '../middleware/isCustomer.js';
import isStaff from '../middleware/isStaff.js';
import authorizedReservationCustomer from '../middleware/authorizedReservationCustomer.js';
import authorizedReservationStaff from '../middleware/authorizedReservationStaff.js'
import * as reservationController from '../controllers/reservation.controller.js';
import wrapRoutes from '../helpers/wrapRoutes.js';

const router = wrapRoutes(express.Router());

// [Customer] - Get all of customer's reservations
router.get('/', [auth], reservationController.getReservationsByCustomer);

// [Customer] - Get customer's individual reservation
router.get('/:id', [validateObjectId(), auth, authorizedReservationCustomer], reservationController.getReservationById);

// [Customer] - Create reservation
router.post('/', [auth, isCustomer], reservationController.createReservation);

// [Staff] - Update reservation status
router.patch('/:id/status', [validateObjectId(), auth, isStaff, authorizedReservationStaff], reservationController.updateReservationStatus);

// [Customer] - Update reservation
router.patch('/:id', [validateObjectId(), auth, authorizedReservationCustomer], reservationController.updateReservation);

// [Customer] - Delete reservation
router.delete('/:id', [validateObjectId(), auth, authorizedReservationCustomer], reservationController.deleteReservation);

export default router;