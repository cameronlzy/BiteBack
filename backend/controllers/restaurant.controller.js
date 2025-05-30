const restaurantService = require('../services/restaurant.service');
const { validateRestaurant } = require('../validators/restaurant.validator');
const Joi = require('joi');
const { ISOdate } = require('../helpers/time.helper');

exports.getAllRestaurants = async (req, res) => {
    const data = await restaurantService.getAll();
    return res.status(data.status).send(data.body)
};

exports.getRestaurantById = async (req, res) => {
    const data = await restaurantService.getById(req.params.id);
    return res.status(data.status).send(data.body);
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

    const data = await restaurantService.create(req.user, req.body);
    return res.status(data.status).send(data.body);
};

exports.updateRestaurant = async (req, res) => {
    // validate request
    const { error } = validateRestaurant(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const data = await restaurantService.update(req.params.id, req.user, req.body);
    return res.status(data.status).send(data.body);
};

exports.deleteRestaurant = async (req, res) => {
    const data = await restaurantService.delete(req.params.id, req.user);
    return res.status(data.status).send(data.body);
};
