import Joi from 'joi';
import { paginationSchema } from './pagination.validator.js';

const allowedStatuses = ['active', 'activated', 'completed', 'expired'];

export function validateHistory(history) {
    const schema = paginationSchema.keys({
        status: Joi.array().items(Joi.string().valid(...allowedStatuses)).optional(),
    });
    return schema.validate(history);
}

export function validateRedemption(redemption) {
    const schema = Joi.object({
        rewardItem: Joi.objectId().required(),
    });
    return schema.validate(redemption);
}

export function validateCode(redemption) {
    const schema = Joi.object({
        code: Joi.string().pattern(/^\d{6}$/).required(),
    });
    return schema.validate(redemption);
}