import * as restaurantService from '../services/restaurant.service.js';
import * as imageService from '../services/image.service.js';
import * as analyticsService from '../services/analytics.service.js';
import Restaurant from '../models/restaurant.model.js';
import { validateRestaurant, validateRestaurantBulk, validatePatch, validateImages, validateDiscover, validateSearch, validateEventQuery, validatePreordersToggle } from '../validators/restaurant.validator.js';
import Joi from '../validators/joi.js';
import { dateFullOnly } from '../helpers/time.helper.js';
import { wrapError } from '../helpers/response.js';

export async function searchRestaurants(req, res) {
    // validate query
    const { error, value } = validateSearch(req.query);
    if (error) return res.status(400).json(wrapError(error.details[0].message));

    const { status, body } = await restaurantService.searchRestaurants(value);
    return res.status(status).json(body)
};

export async function discoverRestaurants(req, res) {
    const {
        cuisines,
        tags,
        minRating,
        lat,
        lng,
        radius,
        openNow,
    } = req.query;

    const filters = {
        cuisines: cuisines ? cuisines.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        tags: tags ? tags.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        minRating: minRating !== undefined ? parseFloat(minRating) : undefined,
        location: (lat !== undefined && lng !== undefined)
            ? { lat: parseFloat(lat), lng: parseFloat(lng) }
            : undefined,
        radius: radius !== undefined ? parseInt(radius) : undefined,
        openNow: openNow === 'true',
    };

    const { error, value } = validateDiscover(filters);
    if (error) return res.status(400).json(wrapError(error.details[0].message));
    
    const { status, body } = await restaurantService.discoverRestaurants(value);
    return res.status(status).json(body);
};

export async function getRestaurantById(req, res) {
    const { status, body } = await restaurantService.getRestaurantById(req.params.id);
    return res.status(status).json(body);
};

export async function getAvailability(req, res) {
    // validate query
    const schema = Joi.object({ date: dateFullOnly.required() });
    const { error, value } = schema.validate(req.query);
    if (error) return res.status(400).json(wrapError(error.details[0].message));

    const { status, body } = await restaurantService.getAvailability(req.params.id, value);
    return res.status(status).json(body);
};

export async function getFootfall(req, res) {
    const { status, body } = await analyticsService.getFootfall(req.params.id);
    return res.status(status).json(body);
}

export async function getVisitCount(req, res) {
    const { status, body } = await restaurantService.getVisitCount(req.user, req.params.id);
    return res.status(status).json(body);
};

export async function getReservationsByRestaurant(req, res) {
  const { error, value } = validateEventQuery(req.query);
  if (error) return res.status(400).json(wrapError(error.details[0].message));

  const { status, body } = await restaurantService.getReservationsByRestaurant(req.restaurant, value);
  return res.status(status).json(body);
};

export async function createRestaurant(req, res) {
    // validate request
    const { error, value } = validateRestaurant(req.body);
    if (error) return res.status(400).json(wrapError(error.details[0].message));

    const { status, body } = await restaurantService.createRestaurant(req.user, value);
    return res.status(status).json(body);
};

export async function createRestaurantBulk(req, res) {
    // validate request
    const { error, value } = validateRestaurantBulk(req.body);
    if (error) return res.status(400).json(wrapError(error.details[0].message));

    const { status, body } = await restaurantService.createRestaurantBulk(req.user, value.restaurants);
    return res.status(status).json(body);
};

export async function addRestaurantImages(req, res) {
    const { status, body } = await imageService.addImages(Restaurant, req.restaurant._id, req.files, 'images');
    return res.status(status).json(body.image);
};

export async function updateRestaurantImages(req, res) {
    const { error, value } = validateImages(req.body);
    if (error) return res.status(400).json(wrapError(error.details[0].message));
    
    const { status, body } = await restaurantService.updateRestaurantImages(req.restaurant, value.images);
    return res.status(status).json(body);
};

export async function togglePreorders(req, res) {
    const { error, value } = validatePreordersToggle(req.body);
    if (error) return res.status(400).json(wrapError(error.details[0].message));

    const { status, body } = await restaurantService.togglePreorders(req.restaurant, value);
    return res.status(status).json(body);
}

export async function updateRestaurant(req, res) {
    // validate request
    const { error, value } = validatePatch(req.body);
    if (error) return res.status(400).json(wrapError(error.details[0].message));

    const { status, body } = await restaurantService.updateRestaurant(req.restaurant, value);
    return res.status(status).json(body);
};

export async function deleteRestaurant(req, res) {
    const { status, body } = await restaurantService.deleteRestaurant(req.restaurant, req.user);
    return res.status(status).json(body);
};
