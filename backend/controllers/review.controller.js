const reviewService = require('../services/review.service');

exports.getReviewsByRestaurant = async (req, res) => {
    const data = await reviewService.fetchReviewsByRestaurant(req.params.id);
    return res.status(data.status).send(data.body);
};

exports.getReviewsByCustomer = async (req, res) => {
  const data = await reviewService.fetchReviewsByCustomer(req.params.id);
  return res.status(data.status).send(data.body);
};

exports.getReviewById = async (req, res) => {
  const data = await reviewService.fetchReviewById(req.params.id);
  return res.status(data.status).send(data.body);
};

exports.createReview = async (req, res) => {
  const data = await reviewService.createReview(req.body, req.user);
  return res.status(data.status).send(data.body);
};

exports.deleteReview = async (req, res) => {
  const data = await reviewService.deleteReview(req.params.id, req.user);
  return res.status(data.status).send(data.body);
};