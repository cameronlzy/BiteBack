import express from 'express';
import * as orderController from '../controllers/order.controller.js';
import auth from '../middleware/auth.js';
import isCustomer from '../middleware/isCustomer.js';
import isStaff from '../middleware/isStaff.js';
import wrapRoutes from '../helpers/wrapRoutes.js';
import validateObjectId from '../middleware/validateObjectId.js';
import authorizedOrderCustomer from '../middleware/authorizedOrderCustomer.js';
import authorizedOrderStaff from '../middleware/authorizedOrderStaff.js';
import authorizedRestaurantStaff from '../middleware/authorizedRestaurantStaff.js';

const router = wrapRoutes(express.Router());

// [Customer] - Get order history
router.get('/', [auth, isCustomer], orderController.getOrdersByCustomer);

// [Staff] - Get order by code
router.get('/code/:code', [auth, isStaff], orderController.getOrderByCode);

// [Staff] - Get order by customer
router.get('/customer/:id', [validateObjectId(), auth, isStaff], orderController.getOrderByCustomer);

// [Staff] - Get orders by restaurant
router.get('/restaurant/:id', [validateObjectId(), auth, isStaff, authorizedRestaurantStaff], orderController.getOrdersByRestaurant);

// [Customer] - Get order by ID
router.get('/:id', [validateObjectId(), auth, isCustomer, authorizedOrderCustomer], orderController.getOrderById);

// [Customer] - Create order
router.post('/', [auth, isCustomer], orderController.createOrder);

// [Staff] - Add tableNumber to order
router.patch('/:id/table', [validateObjectId(), auth, isStaff, authorizedOrderStaff], orderController.addTableNumber);

// [Staff] - Update order status
router.patch('/:id/status', [validateObjectId(), auth, isStaff, authorizedOrderStaff], orderController.updateStatus);

// [Customer] - Edit order
router.patch('/:id', [validateObjectId(), auth, isCustomer, authorizedOrderCustomer], orderController.updateOrder);

export default router;