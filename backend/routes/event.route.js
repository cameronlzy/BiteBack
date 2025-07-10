import express from 'express';
import auth from '../middleware/auth.js';
import validateObjectId from '../middleware/validateObjectId.js';
import isOwner from '../middleware/isOwner.js';
import authorizedEventOwner from '../middleware/authorizedEventOwner.js';
import parser from '../middleware/cloudinaryUpload.js';
import * as eventController from '../controllers/event.controller.js';
import wrapRoutes from '../helpers/wrapRoutes.js';

const router = wrapRoutes(express.Router());

const eventParser = parser('events');

// [Public] - Get all public events
router.get('/', eventController.getAllPublicEvents);

// [Owner] - Get all events by owner
router.get('/owner', [auth, isOwner], eventController.getEventsByOwner);

// [Public] - Get restaurant's private events
router.get('/restaurant/:id', [validateObjectId()], eventController.getPrivateEventsByRestaurant);

// [Public] - Get event by ID
router.get('/:id', [validateObjectId()], eventController.getEventById);

// [Owner] - Create event
router.post('/', [auth, isOwner], eventController.createEvent);

// [Owner] - Upload images for event
router.post('/:id/images', [validateObjectId(), auth, isOwner, authorizedEventOwner, eventParser.fields([{ name: 'mainImage', maxCount: 1 }, { name: 'bannerImage', maxCount: 1 }])], eventController.addEventImages);

// [Owner] - Update images for event
router.patch('/:id/images', [validateObjectId(), auth, isOwner, authorizedEventOwner, eventParser.fields([{ name: 'mainImage', maxCount: 1 }, { name: 'bannerImage', maxCount: 1 }])], eventController.updateEventImages);

// [Customer] - Update event
router.patch('/:id', [validateObjectId(), auth, authorizedEventOwner], eventController.updateEvent);

// [Customer] - Delete event
router.delete('/:id', [validateObjectId(), auth, authorizedEventOwner], eventController.deleteEvent);

export default router;