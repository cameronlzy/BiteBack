import * as reservationService from '../services/reservation.service.js';
import { validateReservation, validatePatch } from '../validators/reservation.validator.js';

export async function getReservationsByRestaurant(req, res) {
  const { status, body } = await reservationService.getReservationsByRestaurant(req.restaurant);
  return res.status(status).json(body);
};

export async function getUserReservations(req, res) {
  const { status, body } = await reservationService.getUserReservations(req.user._id);
  return res.status(status).json(body);
};

export async function getSingleReservation(req, res) {
  const { status, body } = await reservationService.getSingleReservation(req.reservation);
  return res.status(status).json(body);
};

export async function createReservation(req, res) {
  // validate request
  const { error } = validateReservation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const { status, body } = await reservationService.createReservation(req.user, req.body);
  return res.status(status).json(body);
};

export async function updateReservation(req, res) {
  // validate new reservation
  const { error } = validatePatch(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const { status, body } = await reservationService.updateReservation(req.reservation, req.body);
  return res.status(status).json(body);
};

export async function deleteReservation(req, res) {
  const { status, body } = await reservationService.deleteReservation(req.reservation);
  return res.status(status).json(body);
};

