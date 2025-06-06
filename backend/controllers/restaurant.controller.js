const restaurantService = require('../services/restaurant.service');
const imageService = require('../services/image.service');
const Restaurant = require('../models/restaurant.model');
const { validateRestaurant, validateRestaurantBulk, validatePatch, validateImages } = require('../validators/restaurant.validator');
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

exports.createRestaurantBulk = async (req, res) => {
    // validate request
    const { error } = validateRestaurantBulk(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const { status, body } = await restaurantService.createRestaurantBulk(req.user, req.body.restaurants);
    return res.status(status).json(body);
};

exports.addRestaurantImages = async (req, res) => {
    const { status, body } = await imageService.addImages(Restaurant, req.restaurant._id, req.files, 'images');
    return res.status(status).json(body);
};

exports.updateRestaurantImages = async (req, res) => {
    const { error } = validateImages(req.body);
    if (error) return res.status(400).send(error.details[0].message);
    
    const { status, body } = await restaurantService.updateRestaurantImages(req.restaurant, req.body.images);
    return res.status(status).json(body);
};

exports.updateRestaurant = async (req, res) => {
    // validate request
    const { error } = validatePatch(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const { status, body } = await restaurantService.updateRestaurant(req.restaurant, req.body);
    return res.status(status).json(body);
};

exports.deleteRestaurant = async (req, res) => {
    const { status, body } = await restaurantService.deleteRestaurant(req.restaurant, req.user);
    return res.status(status).json(body);
};
