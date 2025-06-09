const auth = require('../middleware/auth');
const isCustomer = require('../middleware/isCustomer');
// const isStaff = require('../middleware/isStaff');
const authorizedQueueCustomer = require('../middleware/authorizedQueueCustomer');
// const authorizedRestaurantStaff = require('../middleware/authorizedRestaurantStaff');
const express = require('express');
const queueController = require('../controllers/queue.controller');
const validateObjectId = require('../middleware/validateObjectId');
const wrapRoutes = require('../helpers/wrapRoutes');
const router = wrapRoutes(express.Router());

// [Customer] - Get their queue status
router.get('/:id', [validateObjectId, auth, isCustomer, authorizedQueueCustomer], queueController.getStatus);

// [Customer] - Join the queue
router.post('/', [auth, isCustomer], queueController.joinQueue);

// [Customer] - Leave the queue
router.delete('/:id', [validateObjectId, auth, isCustomer, authorizedQueueCustomer], queueController.leaveQueue);

// // [Staff] - Get restaurant queue
// router.get('/restaurant/:id', [validateObjectId, auth, isStaff, authorizedRestaurantStaff], queueController.getRestaurantQueue);

// // [Staff] - Update queue entry status
// router.patch('/:id/status', [validateObjectId, auth, isStaff, authorizedRestaurantStaff], queueController.updateQueueStatus);

// // [Staff] - Calls next in restaurant queue
// router.patch('/restaurant/:id/next', [validateObjectId, auth, isStaff, authorizedRestaurantStaff], queueController.callRestaurantNext);

module.exports = router; 