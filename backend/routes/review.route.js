import express from 'express';
import auth from '../middleware/auth.js';
import isCustomer from '../middleware/isCustomer.js';
import isOwner from '../middleware/isOwner.js';
import validateObjectId from '../middleware/validateObjectId.js';
import optionalAuth from '../middleware/optionalAuth.js';
import authorizedReviewCustomer from '../middleware/authorizedReviewCustomer.js';
import authorizedReviewRestaurantOwner from '../middleware/authorizedReviewRestaurantOwner.js';
import parser from '../middleware/cloudinaryUpload.js';
import wrapRoutes from '../helpers/wrapRoutes.js';
import * as reviewController from '../controllers/review.controller.js';

const router = wrapRoutes(express.Router());

const reviewParser = parser('reviews');

// [Customer] - Get customer's past visits to the restaurant that have not been reviewed
router.get('/eligible-visits', [auth, isCustomer], reviewController.getEligibleVisits);

// [Public] - Get all reviews for a restaurant
router.get('/restaurant/:id', [validateObjectId, optionalAuth], reviewController.getReviewsByRestaurant);

// [Public] - Get all reviews submitted by a customer
router.get('/customer/:id',[validateObjectId, optionalAuth], reviewController.getReviewsByCustomer);

// [Public] - Get a single review by ID
router.get('/:id', validateObjectId, reviewController.getReviewById);

// [Customer] - Create a new review
router.post('/', [auth, isCustomer], reviewController.createReview);

// [Owner] - Create a new owner reply to a review
router.post('/:id/reply', [validateObjectId, auth, isOwner, authorizedReviewRestaurantOwner], reviewController.createReply);

// [Customer] - Add or Update a badge vote on a review
router.post('/:id/badges', [validateObjectId, auth, isCustomer], reviewController.addBadge);

// [Customer] - Upload images for their review
router.post('/:id/images', [auth, isCustomer, authorizedReviewCustomer, reviewParser.array('images', 5)], reviewController.addReviewImages);

// [Customer] - Delete a review (owned by the customer)
router.delete('/:id', [validateObjectId, auth, isCustomer, authorizedReviewCustomer], reviewController.deleteReview);

// [Owner] - Delete a reply (owned by the owner)
router.delete('/:id/reply', [validateObjectId, auth, isOwner, authorizedReviewRestaurantOwner], reviewController.deleteReply);

// [Customer] - Delete badge vote by current user on a review
router.delete('/:id/badges', [validateObjectId, auth, isCustomer], reviewController.deleteBadge);

export default router;