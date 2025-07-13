import Joi from 'joi';
import { dateFullOnly } from '../helpers/time.helper.js';

export function validateSummaryQuery(query) {
    const schema = Joi.object({
        unit: Joi.string().valid('day', 'week', 'month'),
        amount: Joi.when('unit', {
            is: Joi.exist(),
            then: Joi.number().integer().min(1).default(1),
            otherwise: Joi.forbidden()
        }),
        date: dateFullOnly
    })
    .xor('date', 'unit');
    return schema.validate(query);
}

export function validateTrendsQuery(query) {
    const schema = Joi.object({
        days: Joi.number().integer().min(1).max(180).default(1),
    });
    return schema.validate(query);
}