import express from 'express';
import auth from '../middleware/auth.js';
import isCustomer from '../middleware/isCustomer.js';
import isStaff from '../middleware/isStaff.js';
import authorizedQueueCustomer from '../middleware/authorizedQueueCustomer.js';
import authorizedRestaurantStaff from '../middleware/authorizedRestaurantStaff.js';
import * as queueController from '../controllers/queue.controller.js';
import validateObjectId from '../middleware/validateObjectId.js';
import wrapRoutes from '../helpers/wrapRoutes.js';

const router = wrapRoutes(express.Router());

// [Customer] - Get their queue status
router.get('/:id', [validateObjectId, auth, isCustomer, authorizedQueueCustomer], queueController.getStatus);

// [Customer] - Join the queue
router.post('/', [auth, isCustomer], queueController.joinQueue);

// [Customer] - Leave the queue
router.delete('/:id', [validateObjectId, auth, isCustomer, authorizedQueueCustomer], queueController.leaveQueue);

// [Public] - Get restaurant queue
router.get('/restaurant/:id', validateObjectId, queueController.getRestaurantQueue);

// [Staff] - Get restaurant queue
router.get('/restaurant/:id/overview', [validateObjectId, auth, isStaff, authorizedRestaurantStaff], queueController.getRestaurantQueueOverview);

// // [Staff] - Update queue entry status
// router.patch('/:id/status', [validateObjectId, auth, isStaff, authorizedRestaurantStaff], queueController.updateQueueStatus);

// // [Staff] - Calls next in restaurant queue
// router.patch('/restaurant/:id/next', [validateObjectId, auth, isStaff, authorizedRestaurantStaff], queueController.callRestaurantNext);

export default router;