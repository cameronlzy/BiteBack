const reservationService = require('../services/reservation.service');
const { validateReservation, validatePatch } = require('../validators/reservation.validator');

exports.getReservationsByRestaurant = async (req, res) => {
  const { status, body } = await reservationService.getReservationsByRestaurant(req.restaurant);
  return res.status(status).json(body);
};

exports.getUserReservations = async (req, res) => {
  const { status, body } = await reservationService.getUserReservations(req.user._id);
  return res.status(status).json(body);
};

exports.getSingleReservation = async (req, res) => {
  const { status, body } = await reservationService.getSingleReservation(req.reservation);
  return res.status(status).json(body);
};

exports.createReservation = async (req, res) => {
  // validate request
  const { error } = validateReservation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const { status, body } = await reservationService.createReservation(req.user, req.body);
  return res.status(status).json(body);
};

exports.updateReservation = async (req, res) => {
  // validate new reservation
  const { error } = validatePatch(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const { status, body } = await reservationService.updateReservation(req.reservation, req.body);
  return res.status(status).json(body);
};

exports.deleteReservation = async (req, res) => {
  const { status, body } = await reservationService.deleteReservation(req.reservation);
  return res.status(status).json(body);
};

