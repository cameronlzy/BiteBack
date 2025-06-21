import express from 'express';
import * as ownerController from '../controllers/owner.controller.js';
import auth from '../middleware/auth.js';
import isOwner from '../middleware/isOwner.js';
import wrapRoutes from '../helpers/wrapRoutes.js';

const router = wrapRoutes(express.Router());

// [Owner] - Get all information for private profile page
router.get('/me', [auth, isOwner], ownerController.getMe);

// [Owner] - Get all staff username and password for each restaurant
router.post('/staff/access', [auth, isOwner], ownerController.getStaffWithStepUp);

// [Owner] - Update owner information
router.patch('/me', [auth, isOwner], ownerController.updateMe);

// [Owner] - Delete customer
router.delete('/me', [auth, isOwner], ownerController.deleteMe);

export default router;