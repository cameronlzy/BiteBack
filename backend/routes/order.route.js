import express from 'express';
import * as orderController from '../controllers/order.controller.js';
import auth from '../middleware/auth.js';
import isCustomer from '../middleware/isCustomer.js';
import isStaff from '../middleware/isStaff.js';
import wrapRoutes from '../helpers/wrapRoutes.js';
import validateObjectId from '../middleware/validateObjectId.js';
import authorizedOrderCustomer from '../middleware/authorizedOrderCustomer.js';

const router = wrapRoutes(express.Router());

// [Customer] - Get order history
router.get('/', [auth, isCustomer], orderController.getOrdersByCustomer);

// [Staff] - Get order by code
router.get('/code/:code', [auth, isStaff], orderController.getOrderByCode);

// [Customer] - Get order by ID
router.get('/:id', [validateObjectId(), auth, isCustomer, authorizedOrderCustomer], orderController.getOrderById);

// [Customer] - Create order
router.post('/', [auth, isCustomer], orderController.createOrder);

// [Customer] - Edit order
router.patch('/:id', [validateObjectId(), auth, isCustomer, authorizedOrderCustomer], orderController.updateOrder);

export default router;