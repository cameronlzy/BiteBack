import * as eventService from '../services/event.service.js';
import validatePagination from '../validators/pagination.validator.js';
import { validateEvent, validatePatch } from '../validators/event.validator.js';
import { wrapError } from '../helpers/response.js';

export async function getAllEvents(req, res) {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 8);
    const query = { page, limit };

    const { error } = validatePagination(query);
    if (error) return res.status(400).json(wrapError(error.details[0].message));

    const { status, body } = await eventService.getAllEvents(query);
    return res.status(status).json(body);
}

export async function getEventsByRestaurant(req, res) {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 8);
    const query = { page, limit };

    const { error } = validatePagination(query);
    if (error) return res.status(400).json(wrapError(error.details[0].message));

    const { status, body } = await eventService.getEventsByRestaurant(req.params.id, query);
    return res.status(status).json(body);
}

export async function getEventById(req, res) {
    const { status, body } = await eventService.getEventById(req.params.id);
    return res.status(status).json(body);
}

export async function createEvent(req, res) {
    const { error } = validateEvent(req.body);
    if (error) return res.status(400).json(wrapError(error.details[0].message));
    
    const { status, body } = await eventService.createEvent(req.body);
    return res.status(status).json(body);
}

export async function updateEvent(req, res) {
    const { error } = validatePatch(req.body);
    if (error) return res.status(400).json(wrapError(error.details[0].message));
    
    const { status, body } = await eventService.updateEvent(req.event, req.restaurant, req.body);
    return res.status(status).json(body);
}

export async function deleteEvent(req, res) {
    const { status, body } = await eventService.deleteEvent(req.event);
    return res.status(status).json(body);
}