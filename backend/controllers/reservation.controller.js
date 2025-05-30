const reservationService = require('../services/reservation.service');
const Joi = require('joi');
const { ISOdate } = require('../helpers/time.helper');

exports.getReservationsByOwner = async (req, res) => {
    const schema = Joi.object({ startDate: ISOdate.required(), endDate: ISOdate });
    const { error } = schema.validate(req.query);
    if (error) return res.status(400).send(error.details[0].message);

    const data = await reservationService.getReservationsByOwner(req.user._id, req.query);
    return res.status(data.status).send(data.body);
};

exports.getReservationsByRestaurant = async (req, res) => {
  const schema = Joi.object({ startDate: ISOdate.required(), endDate: ISOdate });
  const { error } = schema.validate(req.query);
  if (error) return res.status(400).send(error.details[0].message);

  const data = await reservationService.getReservationsByRestaurant(req.user, req.params.id, req.query);
  return res.status(data.status).send(data.body);
};

exports.getUserReservations = async (req, res) => {
  const data = await reservationService.getUserReservations(req.user._id);
  return res.status(data.status).send(data.body);
};

exports.getSingleReservation = async (req, res) => {
  const data = await reservationService.getSingleReservation(req.user._id, req.params.id);
  return res.status(data.status).send(data.body);
};

exports.createReservation = async (req, res) => {
  const data = await reservationService.createReservation(req.user, req.body);
  return res.status(data.status).send(data.body);
};

exports.updateReservation = async (req, res) => {
  const data = await reservationService.updateReservation(req.user._id, req.params.id, req.body);
  return res.status(data.status).send(data.body);
};

exports.deleteReservation = async (req, res) => {
  const data = await reservationService.deleteReservation(req.user._id, req.params.id);
  return res.status(data.status).send(data.body);
};

