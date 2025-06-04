const reviewService = require('../services/review.service');
const { validateReview, validateReply } = require('../validators/review.validator');

exports.getReviewsByRestaurant = async (req, res) => {
    const { status, body } = await reviewService.getReviewsByRestaurant(req.params.id);
    return res.status(status).json(body);
};

exports.getReviewsByCustomer = async (req, res) => {
  const { status, body } = await reviewService.getReviewsByCustomer(req.params.id);
  return res.status(status).json(body);
};

exports.getReviewById = async (req, res) => {
  const { status, body } = await reviewService.getReviewById(req.params.id);
  return res.status(status).json(body);
};

exports.createReview = async (req, res) => {
  // validate request
  const { error } = validateReview(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const { status, body } = await reviewService.createReview(req.body, req.user);
  return res.status(status).json(body);
};

exports.createReply = async (req, res) => {
  // validate request
  const { error } = validateReply(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const { status, body } = await reviewService.createReply(req.body, req.review, req.user);
  return res.status(status).json(body);
};

exports.deleteReview = async (req, res) => {
  const { status, body } = await reviewService.deleteReview(req.review);
  return res.status(status).json(body);
};

exports.deleteReply = async (req, res) => {
  const { status, body } = await reviewService.deleteReply(req.review);
  return res.status(status).json(body);
};