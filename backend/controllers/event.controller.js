import * as eventService from '../services/event.service.js';
import { addImage, deleteImagesFromDocument } from '../services/image.service.js';
import validatePagination from '../validators/pagination.validator.js';
import { validateEvent, validatePatch } from '../validators/event.validator.js';
import { wrapError } from '../helpers/response.js';
import Event from '../models/event.model.js';

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

export async function addEventImages(req, res) {
    const mainImage = req.files?.mainImage?.[0];
    const bannerImage = req.files?.bannerImage?.[0];

    if (!mainImage || !bannerImage) {
        return res.status(400).json(wrapError('Both mainImage and bannerImage are required.'));
    }
    
    const [mainResult, bannerResult] = await Promise.all([
        addImage(Event, req.event._id, mainImage, 'mainImage'),
        addImage(Event, req.event._id, bannerImage, 'bannerImage'),
    ]);

    const failed = [mainResult, bannerResult].find(res => res?.status !== 200);
    if (failed) return res.status(400).json(failed.body);

    return res.status(200).json({
        mainImage: mainResult.body.mainImage,
        bannerImage: bannerResult.body.bannerImage
    });
}

export async function updateEventImages(req, res) {
    const mainImage = req.files?.mainImage?.[0];
    const bannerImage = req.files?.bannerImage?.[0];

    if (!mainImage && !bannerImage) return res.status(400).json(wrapError('Please provide at least one image'));

    const event = req.event;

    const deleteOldImages = [];
    if (mainImage && event.mainImage) {
        deleteOldImages.push(deleteImagesFromDocument(event, 'mainImage'));
    }
    if (bannerImage && event.bannerImage) {
        deleteOldImages.push(deleteImagesFromDocument(event, 'bannerImage'));
    }
    await Promise.all(deleteOldImages);

    const [mainResult, bannerResult] = await Promise.all([
        mainImage ? addImage(Event, event._id, mainImage, 'mainImage') : Promise.resolve(null),
        bannerImage ? addImage(Event, event._id, bannerImage, 'bannerImage') : Promise.resolve(null)
    ]);

    const failed = [mainResult, bannerResult].find(res => res?.status !== 200);
    if (failed) return res.status(400).json(failed.body);

    const body = {};
    if (mainResult) body.mainImage = mainResult.body.mainImage;
    if (bannerResult) body.bannerImage = bannerResult.body.bannerImage;
    return res.status(200).json(body);
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