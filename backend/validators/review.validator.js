const Joi = require('joi');
const { ISOdate } = require('../helpers/time.helper');

function validateReview(review) {
    const schema = Joi.object({
        restaurant: Joi.objectId().required(),
        rating: Joi.number().integer().min(0).max(5).required(),
        reviewText: Joi.string().allow('').min(0).max(1000).required(),
        dateVisited: ISOdate.required()
    });
    return schema.validate(review);
}

function validateReply(reply) {
    const schema = Joi.object({
        replyText: Joi.string().min(1).max(1000).required()
    });
    return schema.validate(reply);
}

function validateBadge(badge) {
    const schema = Joi.object({
        badgeIndex: Joi.number().integer().min(0).max(3).required()
    });
    return schema.validate(badge);
}

module.exports = {
    validateReview,
    validateReply,
    validateBadge,
};