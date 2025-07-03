import * as queueService from '../services/queue.service.js';
import { removeClient, addClient } from '../helpers/sse.helper.js';
import { validateEntry, validateQueueGroup, validateStatus, validateToggle } from '../validators/queueEntry.validator.js';
import { wrapError } from '../helpers/response.js';

export function subscribeToQueue(req, res) {
    const customerId = req.user.profile.toString();

    res.set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',

        'X-Accel-Buffering': 'no',
    });

    res.flushHeaders();

    addClient(customerId, res);

    // keep connection alive
    const keepAliveInterval = setInterval(() => {
        res.write(':\n\n'); 
    }, 30000);

    // cleaning up on disconnect
    req.on('close', () => {
        clearInterval(keepAliveInterval);
        removeClient(customerId);
    });
}

export async function getStatus(req, res) {
    return res.status(200).json(req.queueEntry.toObject());
};

export async function joinQueue(req, res) {
    const { error } = validateEntry(req.body);
    if (error) return res.status(400).json(wrapError(error.details[0].message));

    const { status, body } = await queueService.joinQueue(req.user, req.body);
    return res.status(status).json(body);
}

export async function leaveQueue(req, res) {
    const { status, body } = await queueService.leaveQueue(req.queueEntry);
    return res.status(status).json(body);
}

export async function getRestaurantQueue(req, res) {
    const { status, body } = await queueService.getRestaurantQueue(req.params.id);
    return res.status(status).json(body);
}

export async function getRestaurantQueueOverview(req, res) {
    const { status, body } = await queueService.getRestaurantQueueOverview(req.restaurant);
    return res.status(status).json(body);
}

export async function updateQueueEntryStatus(req, res) {
    const { error } = validateStatus(req.body);
    if (error) return res.status(400).json(wrapError(error.details[0].message));

    const { status, body } = await queueService.updateQueueEntryStatus(req.queueEntry, req.body);
    return res.status(status).json(body);
}

export async function callNext(req, res) {
    const { error } = validateQueueGroup(req.query);
    if (error) return res.status(400).json(wrapError(error.details[0].message));

    const { status, body } = await queueService.callNext(req.restaurant, req.query.queueGroup);
    return res.status(status).json(body);
}

export async function toggleQueue(req, res) {
    const { error } = validateToggle(req.body);
    if (error) return res.status(400).json(wrapError(error.details[0].message));
    
    const { status, body } = await queueService.toggleQueue(req.restaurant, req.body.enabled);
    return res.status(status).json(body);
}