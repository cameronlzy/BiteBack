const express = require('express');
const auth = require('../middleware/auth');
const isCustomer = require('../middleware/isCustomer');
const isOwner = require('../middleware/isOwner');
const validateObjectId = require('../middleware/validateObjectId');
const optionalAuth = require('../middleware/optionalAuth');
const authorizedReviewCustomer = require('../middleware/authorizedReviewCustomer');
const authorizedReviewRestaurantOwner = require('../middleware/authorizedReviewRestaurantOwner');
const wrapRoutes = require('../helpers/wrapRoutes');
const reviewController = require('../controllers/review.controller');
const router = wrapRoutes(express.Router());

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

// [Customer] - Delete a review (owned by the customer)
router.delete('/:id', [validateObjectId, auth, isCustomer, authorizedReviewCustomer], reviewController.deleteReview);

// [Owner] - Delete a reply (owned by the owner)
router.delete('/:id/reply', [validateObjectId, auth, isOwner, authorizedReviewRestaurantOwner], reviewController.deleteReply);

// [Customer] - Delete badge vote by current user on a review
router.delete('/:id/badges', [validateObjectId, auth, isCustomer], reviewController.deleteBadge);

module.exports = router;