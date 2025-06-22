import express from 'express';
import * as promotionController from '../controllers/promotion.controller.js';
// import auth from '../middleware/auth.js';
// import isOwner from '../middleware/isOwner.js';
import wrapRoutes from '../helpers/wrapRoutes.js';
// import validateObjectId from '../middleware/validateObjectId.js';
// import authorizedPromotionOwner from '../middleware/authorizedPromotionOwner.js';

const router = wrapRoutes(express.Router());

// [Public] - Get all promotions that are greater than currentDate + active, with search params
router.get('/', promotionController.searchPromotions);

// // [Public] - Get promotion by ID
// router.get('/:id', [validateObjectId], promotionController.getPromotionById);

// // [Owner] - Create promotion
// router.post('/', [auth, isOwner], promotionController.createPromotion);

// // [Owner] - Update promotion
// router.patch('/:id', [validateObjectId, auth, isOwner, authorizedPromotionOwner], promotionController.updatePromotion);

// // [Owner] - Delete promotion
// router.delete('/me', [validateObjectId, auth, isOwner, authorizedPromotionOwner], promotionController.deletePromotion);

export default router;