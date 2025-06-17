import * as reviewService from '../services/review.service.js';
import * as imageService from '../services/image.service.js';
import Review from '../models/review.model.js';
import { validateReview, validateReply, validateBadge, validateRestaurantId } from '../validators/review.validator.js';

export async function getEligibleVisits(req, res) {
  const { error } = validateRestaurantId(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const { status, body } = await reviewService.getEligibleVisits(req.query.restaurantId, req.user);
  return res.status(status).json(body);
};

export async function getReviewsByRestaurant(req, res) {
  const { status, body } = await reviewService.getReviewsByRestaurant(req.params.id, req.user);
  return res.status(status).json(body);
};

export async function getReviewsByCustomer(req, res) {
  const { status, body } = await reviewService.getReviewsByCustomer(req.params.id, req.user);
  return res.status(status).json(body);
};

export async function getReviewById(req, res) {
  const { status, body } = await reviewService.getReviewById(req.params.id);
  return res.status(status).json(body);
};

export async function createReview(req, res) {
  // validate request
  const { error } = validateReview(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const { status, body } = await reviewService.createReview(req.body, req.user);
  return res.status(status).json(body);
};

export async function createReply(req, res) {
  // validate request
  const { error } = validateReply(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const { status, body } = await reviewService.createReply(req.body, req.review, req.user);
  return res.status(status).json(body);
};

export async function addBadge(req, res) {
  // validate request
  const { error } = validateBadge(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const { status, body } = await reviewService.addBadge(req.body, req.params.id, req.user);
  return res.status(status).json(body);
};

export async function addReviewImages(req, res) {
  const { status, body } = await imageService.addImages(Review, req.review._id, req.files, 'images');
  return res.status(status).json(body.images);
};

export async function deleteReview(req, res) {
  const { status, body } = await reviewService.deleteReview(req.review);
  return res.status(status).json(body);
};

export async function deleteReply(req, res) {
  const { status, body } = await reviewService.deleteReply(req.review);
  return res.status(status).json(body);
};

export async function deleteBadge(req, res) {
  const { status, body } = await reviewService.deleteBadge(req.params.id, req.user);
  return res.status(status).json(body);
};