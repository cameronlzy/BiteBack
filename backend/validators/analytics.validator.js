import Joi from 'joi';
import { ISOdate } from '../helpers/time.helper.js';

export function validateSummaryQuery(query) {
    const schema = Joi.object({
        unit: Joi.string().valid('day', 'week', 'month'),
        amount: Joi.number().integer().min(1),
        date: ISOdate
    }).xor('date', 'unit')
    .with('unit', 'amount')
    .with('amount', 'unit');
    return schema.validate(query);
}

export function validateTrendsQuery(query) {
    const schema = Joi.object({
        days: Joi.number().integer().min(1).max(180).required()
    });
    return schema.validate(query);
}