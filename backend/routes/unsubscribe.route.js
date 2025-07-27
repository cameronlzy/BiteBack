import jwt from 'jsonwebtoken';
import config from 'config';
import CustomerProfile from '../models/customerProfile.model.js';
import express from 'express';
import { wrapError, wrapMessage } from '../helpers/response.js';

import wrapRoutes from '../helpers/wrapRoutes.js';

const router = wrapRoutes(express.Router());

router.get('/', unsubscribeHandler);

async function unsubscribeHandler(req, res) {
    const token = req.query.token;
    if (!token) return res.status(400).json(wrapError('Missing token'));

    try {
        const payload = jwt.verify(token, config.get('jwtPrivateKey'));
        const customer = await CustomerProfile.findById(payload.customerId);
        if (!customer) return res.status(404).json(wrapError('Customer not found.'));

        if (customer.emailOptOut) return res.status(200).json(wrapMessage('You are already unsubscribed'));

        customer.emailOptOut = true;
        await customer.save();

        res.status(200).json(wrapMessage('You have successfully unsubscribed from promotional emails'));
    } catch {
        res.status(400).json(wrapError('Invalid or expired token'));
    }
}

export default router;