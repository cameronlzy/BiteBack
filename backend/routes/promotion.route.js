import express from 'express';
import * as promotionController from '../controllers/promotion.controller.js';
import parser from '../middleware/cloudinaryUpload.js';
import auth from '../middleware/auth.js';
import isOwner from '../middleware/isOwner.js';
import wrapRoutes from '../helpers/wrapRoutes.js';
import validateObjectId from '../middleware/validateObjectId.js';
import authorizedPromotionOwner from '../middleware/authorizedPromotionOwner.js';

const router = wrapRoutes(express.Router());

const promotionParser = parser('promotions');

// [Public] - Get all promotions that are greater than currentDate + active, with search params
router.get('/', promotionController.searchPromotions);

// [Public] - Get all promotions by owner
router.get('/owner', [auth, isOwner], promotionController.getPromotionsByOwner);

// [Public] - Get promotion by ID
router.get('/:id', [validateObjectId], promotionController.getPromotionById);

// [Owner] - Create promotion
router.post('/', [auth, isOwner], promotionController.createPromotion);

// [Owner] - Upload images for promotion
router.post('/:id/images', [validateObjectId, auth, isOwner, authorizedPromotionOwner, promotionParser.fields([{ name: 'mainImage', maxCount: 1 }, { name: 'bannerImage', maxCount: 1 }])], promotionController.addPromotionImages);

// [Owner] - Update images for promotion
router.patch('/:id/images', [validateObjectId, auth, isOwner, authorizedPromotionOwner, promotionParser.fields([{ name: 'mainImage', maxCount: 1 }, { name: 'bannerImage', maxCount: 1 }])], promotionController.updatePromotionImages);

// [Owner] - Update promotion
router.patch('/:id', [validateObjectId, auth, isOwner, authorizedPromotionOwner], promotionController.updatePromotion);

// [Owner] - Delete promotion
router.delete('/:id', [validateObjectId, auth, isOwner, authorizedPromotionOwner], promotionController.deletePromotion);

export default router;