import express from 'express';
import * as rewardsRedemptionsController from '../controllers/rewardRedemption.controller.js';
import auth from '../middleware/auth.js';
import isCustomer from '../middleware/isCustomer.js';
import isStaff from '../middleware/isStaff.js';
import wrapRoutes from '../helpers/wrapRoutes.js';
import validateObjectId from '../middleware/validateObjectId.js';
import authorizedRedemptionCustomer from '../middleware/authorizedRedemptionCustomer.js';

const router = wrapRoutes(express.Router());

// [Customer] - Get redemptions history
router.get('/redemptions', [auth, isCustomer], rewardsRedemptionsController.getAllRedemptions);

// [Customer] - Get redemptions by ID
router.get('/redemptions/:id', [validateObjectId(), auth, isCustomer, authorizedRedemptionCustomer], rewardsRedemptionsController.getRedemptionById);

// [Customer] - Create redemption
router.post('/redemptions', [auth, isCustomer], rewardsRedemptionsController.createRedemption);

// [Staff] - Complete redemption
router.patch('/redemptions/complete', [auth, isStaff], rewardsRedemptionsController.completeRedemption);

// [Customer] - Activate redemption
router.patch('/redemptions/:id', [validateObjectId(), auth, isCustomer, authorizedRedemptionCustomer], rewardsRedemptionsController.activateRedemption);

export default router;