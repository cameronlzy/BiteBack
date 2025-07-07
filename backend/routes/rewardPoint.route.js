import express from 'express';
import * as rewardsPointsController from '../controllers/rewardPoint.controller.js';
import auth from '../middleware/auth.js';
import isCustomer from '../middleware/isCustomer.js';
import isStaff from '../middleware/isStaff.js';
import wrapRoutes from '../helpers/wrapRoutes.js';
import validateObjectId from '../middleware/validateObjectId.js';
import authorizedRestaurantStaff from '../middleware/authorizedRestaurantStaff.js';

const router = wrapRoutes(express.Router());

// [Customer] - Get reward points across all restaurants
router.get('/points', [auth, isCustomer], rewardsPointsController.getAllPoints);

// [Customer] - Get reward points for particular restaurant
router.get('/restaurant/:id/points', [validateObjectId(), auth, isCustomer], rewardsPointsController.getPointByRestaurant);

// [Staff] - Manually add points to customer
router.patch('/restaurant/:id/points', [validateObjectId(), auth, isStaff, authorizedRestaurantStaff], rewardsPointsController.updatePoints);

export default router;