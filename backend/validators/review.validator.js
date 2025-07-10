import Joi from 'joi';
import { dateFullOnly } from '../helpers/time.helper.js';

export function validateReview(review) {
    const schema = Joi.object({
        restaurant: Joi.objectId().required(),
        rating: Joi.number().integer().min(0).max(5).required(),
        reviewText: Joi.string().min(0).max(1000),
        dateVisited: dateFullOnly.required()
    });
    return schema.validate(review);
}

export function validateReply(reply) {
    const schema = Joi.object({
        replyText: Joi.string().min(1).max(1000).required()
    });
    return schema.validate(reply);
}

export function validateBadge(badge) {
    const schema = Joi.object({
        badgeIndex: Joi.number().integer().min(0).max(3).required()
    });
    return schema.validate(badge);
}

export function validateRestaurantId(id) {
    const schema = Joi.object({
        restaurantId: Joi.objectId().required()
    });
    return schema.validate(id);
}