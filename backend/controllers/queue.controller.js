const queueService = require('../services/queue.service');
const { validateEntry } = require('../validators/queueEntry.validator');

exports.getStatus = async (req, res) => {
    return res.status(200).json(req.queueEntry);
};

exports.joinQueue = async (req, res) => {
    const { error } = validateEntry(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const { status, body } = await queueService.joinQueue(req.user, req.body);
    return res.status(status).json(body);
};

exports.leaveQueue = async (req, res) => {
    const { status, body } = await queueService.leaveQueue(req.queueEntry);
    return res.status(status).json(body);
};