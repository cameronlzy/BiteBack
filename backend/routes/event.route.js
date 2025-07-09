import express from 'express';
import auth from '../middleware/auth.js';
import validateObjectId from '../middleware/validateObjectId.js';
import isOwner from '../middleware/isOwner.js';
import authorizedEventOwner from '../middleware/authorizedEventOwner.js';
import * as eventController from '../controllers/event.controller.js';
import wrapRoutes from '../helpers/wrapRoutes.js';

const router = wrapRoutes(express.Router());

// [Public] - Get all events
router.get('/', eventController.getAllEvents);

// [Public] - Get restaurant's events
router.get('/restaurant/:id', [validateObjectId()], eventController.getEventsByRestaurant);

// [Public] - Get event by ID
router.get('/:id', [validateObjectId()], eventController.getEventById);

// [Owner] - Create event
router.post('/', [auth, isOwner], eventController.createEvent);

// [Customer] - Update event
router.patch('/:id', [validateObjectId(), auth, authorizedEventOwner], eventController.updateEvent);

// [Customer] - Delete event
router.delete('/:id', [validateObjectId(), auth, authorizedEventOwner], eventController.deleteEvent);

export default router;