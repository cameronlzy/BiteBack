import * as restaurantService from '../services/restaurant.service.js';
import * as imageService from '../services/image.service.js';
import Restaurant from '../models/restaurant.model.js';
import { validateRestaurant, validateRestaurantBulk, validatePatch, validateImages, validateDiscover, validateSearch } from '../validators/restaurant.validator.js';
import Joi from 'joi';
import { ISOdate } from '../helpers/time.helper.js';

export async function searchRestaurants(req, res) {
    // validate query
    const { error } = validateSearch(req.query);
    if (error) return res.status(400).send(error.details[0].message);

    const { search, page, limit, sortBy, order } = req.query;

    const filters = {
        search: search || null,
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 8,
        sortBy: sortBy ? sortBy : 'averageRating',
        order: order === 'asc' ? 'asc' : 'desc',
    };

    const { status, body } = await restaurantService.searchRestaurants(filters);
    return res.status(status).json(body)
};

export async function discoverRestaurants(req, res) {
    // validate query
    const { error } = validateDiscover(req.query);
    if (error) return res.status(400).send(error.details[0].message);

    const { cuisines, minRating, lat, lng, radius, openNow, tags } = req.query;

    const filters = {
        cuisines: cuisines ? cuisines.split(',') : null,
        minRating: parseFloat(minRating) || 0,
        location: lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null,
        radius: parseInt(radius) || 5000,
        openNow: openNow === 'true',
        tags: tags ? tags.split(',') : null,
    };
    
    const { status, body } = await restaurantService.discoverRestaurants(filters);
    return res.status(status).json(body);
};

export async function getRestaurantById(req, res) {
    const { status, body } = await restaurantService.getRestaurantById(req.params.id);
    return res.status(status).json(body);
};

export async function getAvailability(req, res) {
    // validate query
    const schema = Joi.object({ date: ISOdate.required() });
    const { error } = schema.validate(req.query);
    if (error) return res.status(400).send(error.details[0].message);

    const data = await restaurantService.getAvailability(req.params.id, req.query);
    return res.status(data.status).send(data.body);
};

export async function createRestaurant(req, res) {
    // validate request
    const { error } = validateRestaurant(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const { status, body } = await restaurantService.createRestaurant(req.user, req.body);
    return res.status(status).json(body);
};

export async function createRestaurantBulk(req, res) {
    // validate request
    const { error } = validateRestaurantBulk(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const { status, body } = await restaurantService.createRestaurantBulk(req.user, req.body.restaurants);
    return res.status(status).json(body);
};

export async function addRestaurantImages(req, res) {
    const { status, body } = await imageService.addImages(Restaurant, req.restaurant._id, req.files, 'images');
    return res.status(status).json(body.images);
};

export async function updateRestaurantImages(req, res) {
    const { error } = validateImages(req.body);
    if (error) return res.status(400).send(error.details[0].message);
    
    const { status, body } = await restaurantService.updateRestaurantImages(req.restaurant, req.body.images);
    return res.status(status).json(body);
};

export async function updateRestaurant(req, res) {
    // validate request
    const { error } = validatePatch(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const { status, body } = await restaurantService.updateRestaurant(req.restaurant, req.body);
    return res.status(status).json(body);
};

export async function deleteRestaurant(req, res) {
    const { status, body } = await restaurantService.deleteRestaurant(req.restaurant, req.user);
    return res.status(status).json(body);
};
