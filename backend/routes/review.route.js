const express = require('express');
const auth = require('../middleware/auth');
const isCustomer = require('../middleware/isCustomer');
const validateObjectId = require('../middleware/validateObjectId');
const wrapRoutes = require('../helpers/wrapRoutes');
const {
  getReviewsByRestaurant,
  getReviewsByCustomer,
  getReviewById,
  createReview,
  deleteReview
} = require('../controllers/review.controller');
const router = wrapRoutes(express.Router());

// [Public] - Get all reviews for a restaurant
router.get('/restaurant/:id', validateObjectId, getReviewsByRestaurant);

// [Public] - Get all reviews submitted by a customer
router.get('/customer/:id', validateObjectId, getReviewsByCustomer);

// [Public] - Get a single review by ID
router.get('/:id', validateObjectId, getReviewById);

// [Customer] - Create a new review
router.post('/', [auth, isCustomer], createReview);

// [Customer] - Delete a review (owned by the customer)
router.delete('/:id', [auth, isCustomer], deleteReview);

module.exports = router;