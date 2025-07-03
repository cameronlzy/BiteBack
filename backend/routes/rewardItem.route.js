import express from 'express';
import * as rewardsShopController from '../controllers/rewardItem.controller.js';
import auth from '../middleware/auth.js';
import isOwner from '../middleware/isOwner.js';
import wrapRoutes from '../helpers/wrapRoutes.js';
import validateObjectId from '../middleware/validateObjectId.js';
import authorizedRestaurantOwner from '../middleware/authorizedRestaurantOwner.js';
import authorizedRewardItemOwner from '../middleware/authorizedRewardItemOwner.js';

const router = wrapRoutes(express.Router());

// [Public] - Get all shop items for restaurant
router.get('/restaurant/:id/shop', [validateObjectId()], rewardsShopController.getAllItems);

// [Public] - Get shop item by id
router.get('/shop/:id', [validateObjectId()], rewardsShopController.getItemById);

// [Owner] - Create shop item
router.post('/restaurant/:id/shop', [validateObjectId(), auth, isOwner, authorizedRestaurantOwner], rewardsShopController.createItem);

// [Owner] - Update shop item
router.patch('/restaurant/:id/shop/:itemId', [validateObjectId(['id', 'itemId']), auth, isOwner, authorizedRestaurantOwner, authorizedRewardItemOwner], rewardsShopController.updateItem);

// [Owner] - Delete shop item
router.delete('/restaurant/:id/shop/:itemId', [validateObjectId(['id', 'itemId']), auth, isOwner, authorizedRestaurantOwner, authorizedRewardItemOwner], rewardsShopController.deleteItem);

export default router;