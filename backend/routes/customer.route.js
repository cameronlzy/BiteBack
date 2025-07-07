import express from 'express';
import auth from '../middleware/auth.js';
import * as customerController from '../controllers/customer.controller.js';
import wrapRoutes from '../helpers/wrapRoutes.js';
import validateObjectId from '../middleware/validateObjectId.js';
import isCustomer from '../middleware/isCustomer.js';

const router = wrapRoutes(express.Router());

// [Customer] - Get all information for private profile page
router.get('/me', [auth, isCustomer], customerController.getMe);

// [Public] - Get information for public profile page
router.get('/:id', [validateObjectId()], customerController.publicProfile);

// [Customer] - Update customer information
router.patch('/me', [auth, isCustomer], customerController.updateMe);

// [Customer] - Delete customer
router.delete('/me', [auth, isCustomer], customerController.deleteMe);

export default router;