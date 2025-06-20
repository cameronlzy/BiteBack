import express from 'express';
import auth from '../middleware/auth.js';
import isCustomer from '../middleware/isCustomer.js';
import isStaff from '../middleware/isStaff.js';
// import skipCompression from '../middleware/skipCompression.js';
// import skipHelmet from '../middleware/skipHelmet.js';
import authorizedQueueEntryCustomer from '../middleware/authorizedQueueEntryCustomer.js';
import authorizedRestaurantStaff from '../middleware/authorizedRestaurantStaff.js';
import authorizedQueueEntryStaff from '../middleware/authorizedQueueEntryStaff.js';
import * as queueController from '../controllers/queue.controller.js';
import validateObjectId from '../middleware/validateObjectId.js';
import wrapRoutes from '../helpers/wrapRoutes.js';

const router = wrapRoutes(express.Router());

// [Customer] - SSE to notify the customer when they are called
router.get('/stream', [auth, isCustomer], queueController.subscribeToQueue);

// [Customer] - Get their queue status
router.get('/:id', [validateObjectId, auth, isCustomer, authorizedQueueEntryCustomer], queueController.getStatus);

// [Customer] - Join the queue
router.post('/', [auth, isCustomer], queueController.joinQueue);

// [Customer] - Leave the queue
router.delete('/:id', [validateObjectId, auth, isCustomer, authorizedQueueEntryCustomer], queueController.leaveQueue);

// [Public] - Get restaurant queue
router.get('/restaurant/:id', validateObjectId, queueController.getRestaurantQueue);

// [Staff] - Get restaurant queue
router.get('/restaurant/:id/overview', [validateObjectId, auth, isStaff, authorizedRestaurantStaff], queueController.getRestaurantQueueOverview);

// [Staff] - Update queue entry status
router.patch('/:id/status', [validateObjectId, auth, isStaff, authorizedQueueEntryStaff], queueController.updateQueueEntryStatus);

// [Staff] - Calls next in restaurant queue
router.patch('/restaurant/:id/next', [validateObjectId, auth, isStaff, authorizedRestaurantStaff], queueController.callNext);

// [Staff] - Toggle on and off the queue
router.patch('/restaurant/:id/queue', [validateObjectId, auth, isStaff, authorizedRestaurantStaff], queueController.toggleQueue);

export default router;