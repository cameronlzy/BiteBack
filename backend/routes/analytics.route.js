import express from 'express';
import auth from '../middleware/auth.js';
import validateObjectIds from '../middleware/validateObjectId.js';
import isOwner from '../middleware/isOwner.js';
import authorizedRestaurantOwner from '../middleware/authorizedRestaurantOwner.js';
import * as analyticsController from '../controllers/analytics.controller.js';
import wrapRoutes from '../helpers/wrapRoutes.js';

const router = wrapRoutes(express.Router());

// [Owner] - Get live snapshot today
router.get('/restaurant/:id/snapshot', [validateObjectIds(), auth, isOwner, authorizedRestaurantOwner], analyticsController.getSnapshot);

// [Owner] - Get summary
router.get('/restaurant/:id/summary', [validateObjectIds(), auth, isOwner, authorizedRestaurantOwner], analyticsController.getSummary);

// [Owner] - Get trends
router.get('/restaurant/:id/trends', [validateObjectIds(), auth, isOwner, authorizedRestaurantOwner], analyticsController.getTrends);

export default router;