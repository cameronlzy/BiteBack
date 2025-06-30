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

export function validatePatch(update) {
    const schema = Joi.object({
        title: Joi.string(),
        description: Joi.string(),
        startDate: dateFullOnly,
        endDate: dateFullOnly,
        timeWindow: Joi.object({
            startTime: timeString.required(),
            endTime: timeString.required()
        }).optional(),
        isActive: Joi.boolean()
    }).min(1);
    return schema.validate(update);
}