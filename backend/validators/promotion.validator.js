import Joi from 'joi';
import { dateFullOnly, timeString } from '../helpers/time.helper.js';

export function validatePromotion(promotion) {
    const schema = Joi.object({
        restaurant: Joi.objectId().required(),
        title: Joi.string().required(),
        description: Joi.string().required(),
        startDate: dateFullOnly.required(),
        endDate: dateFullOnly.required(),
        timeWindow: Joi.object({
            startTime: timeString.required(),
            endTime: timeString.required()
        }).optional(),
        isActive: Joi.boolean().required()
    });
    return schema.validate(promotion);
}

export function validateSearch(search) {
    const schema = Joi.object({
        search: Joi.string(),
        restaurants: Joi.string(),
        page: Joi.number().integer().min(1),
        limit: Joi.number().integer().min(1),
        sortBy: Joi.string().valid('startDate', 'endDate', 'title'),
        order: Joi.string().valid('desc', 'asc'),
    });
    return schema.validate(search);
}