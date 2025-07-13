import { wrapError } from '../helpers/response.js';
import * as reservationService from '../services/reservation.service.js';
import { validateReservation, validatePatch, validateStatus } from '../validators/reservation.validator.js';
import validatePagination from '../validators/pagination.validator.js';

export async function getReservationsByCustomer(req, res) {
  const { error, value } = validatePagination(req.query);
  if (error) return res.status(400).json(wrapError(error.details[0].message));

  const { status, body } = await reservationService.getReservationsByCustomer(req.user.profile, value);
  return res.status(status).json(body);
};

export async function getReservationById(req, res) {
  const { status, body } = await reservationService.getReservationById(req.reservation);
  return res.status(status).json(body);
};

export async function createReservation(req, res) {
  const { error, value } = validateReservation(req.body);
  if (error) return res.status(400).json(wrapError(error.details[0].message));

  const { status, body } = await reservationService.createReservation(req.user, value);
  return res.status(status).json(body);
};

export async function updateReservationStatus(req, res) {
  const { error, value } = validateStatus(req.body);
  if (error) return res.status(400).json(wrapError(error.details[0].message));

  const { status, body } = await reservationService.updateReservationStatus(req.reservation, value.status);
  return res.status(status).json(body);
};

export async function updateReservation(req, res) {
  const { error, value } = validatePatch(req.body);
  if (error) return res.status(400).json(wrapError(error.details[0].message));

  const { status, body } = await reservationService.updateReservation(req.reservation, value);
  return res.status(status).json(body);
};

export async function deleteReservation(req, res) {
  const { status, body } = await reservationService.deleteReservation(req.reservation);
  return res.status(status).json(body);
};

