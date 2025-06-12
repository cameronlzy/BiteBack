import * as queueService from '../services/queue.service.js';
import { validateEntry } from '../validators/queueEntry.validator.js';

export async function getStatus(req, res) {
    return res.status(200).json(req.queueEntry);
};

export async function joinQueue(req, res) {
    const { error } = validateEntry(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const { status, body } = await queueService.joinQueue(req.user, req.body);
    return res.status(status).json(body);
}

export async function leaveQueue(req, res) {
    const { status, body } = await queueService.leaveQueue(req.queueEntry);
    return res.status(status).json(body);
}

export async function getRestaurantQueue(req, res) {
    const { status, body } = await queueService.getRestaurantQueue(req.params._id);
    return res.status(status).json(body);
}

export async function getRestaurantQueueOverview(req, res) {
    const { status, body } = await queueService.getRestaurantQueueOverview(req.restaurant);
    return res.status(status).json(body);
}