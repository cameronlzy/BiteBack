const restaurantService = require('../services/restaurant.service');
const { validateRestaurant } = require('../validators/restaurant.validator');
const Joi = require('joi');
const { ISOdate } = require('../helpers/time.helper');

exports.getAllRestaurants = async (req, res) => {
    const { status, body } = await restaurantService.getAllRestaurants();
    return res.status(status).json(body)
};

exports.getRestaurantById = async (req, res) => {
    const { status, body } = await restaurantService.getRestaurantById(req.params.id);
    return res.status(status).json(body);
};

exports.getAvailability = async (req, res) => {
    // validate query
    const schema = Joi.object({ date: ISOdate.required() });
    const { error } = schema.validate(req.query);
    if (error) return res.status(400).send(error.details[0].message);

    const data = await restaurantService.getAvailability(req.params.id, req.query);
    return res.status(data.status).send(data.body);
};

exports.createRestaurant = async (req, res) => {
    // validate request
    const { error } = validateRestaurant(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const { status, body } = await restaurantService.createRestaurant(req.user, req.body);
    return res.status(status).json(body);
};

exports.updateRestaurant = async (req, res) => {
    // validate request
    const { error } = validateRestaurant(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const { status, body } = await restaurantService.updateRestaurant(req.restaurant, req.body);
    return res.status(status).json(body);
};

exports.deleteRestaurant = async (req, res) => {
    const { status, body } = await restaurantService.deleteRestaurant(req.restaurant, req.user);
    return res.status(status).json(body);
};
