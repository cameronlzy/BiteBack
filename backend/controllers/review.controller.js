const reviewService = require('../services/review.service');
const { validateReview } = require('../validators/review.validator');

exports.getReviewsByRestaurant = async (req, res) => {
    const data = await reviewService.getReviewsByRestaurant(req.params.id);
    return res.status(data.status).send(data.body);
};

exports.getReviewsByCustomer = async (req, res) => {
  const data = await reviewService.getReviewsByCustomer(req.params.id);
  return res.status(data.status).send(data.body);
};

exports.getReviewById = async (req, res) => {
  const data = await reviewService.getReviewById(req.params.id);
  return res.status(data.status).send(data.body);
};

exports.createReview = async (req, res) => {
  // validate request
  const { error } = validateReview(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const data = await reviewService.createReview(req.body, req.user);
  return res.status(data.status).send(data.body);
};

exports.deleteReview = async (req, res) => {
  const data = await reviewService.deleteReview(req.params.id, req.user);
  return res.status(data.status).send(data.body);
};