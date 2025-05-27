const mongoose = require('mongoose');
const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);
const { dateAllowPartial, ISOdate } = require('../utils/dateUtil');

const reviewSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CustomerProfile',
        required: true
    },
    username: { type: String, minlength: 3, required: true },
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    rating: {
        type: Number, 
        required: true,
        min: 0, 
        max: 5
    },
    reviewText: {
        type: String,
        required: true, 
        min: 0, 
        max: 1000, 
        default: ''
    },
    dateVisited: {
        type: Date, required: true
    },
    badgesCount: {
        type: [Number],
        required: true,
        validate: {
            validator: function (arr) {
                return (
                    Array.isArray(arr) &&
                    arr.length === 4 &&
                    arr.every(num => Number.isInteger(num) && num >= 0)
                );
            },
            message: 'badgesCount must be an array of 4 non-negative integers.'
        }, default: [0, 0, 0, 0]
    },
    reply: {
        type: {
            owner: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'OwnerProfile',
                required: true
            },
            replyText: {
                type: String,
                required: true,
                maxlength: 1000
            }
        },
        default: undefined
    },
    isVisible: {
        type: Boolean,
        required: true,
        default: false
    }
}, {
    timestamps: { createdAt: true, updatedAt: false }
});

reviewSchema.path('createdAt').immutable(true);

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
        owner: Joi.objectId().required(),
        replyText: Joi.string().min(0).max(1000).required()
    });
    return schema.validate(reply);
}

const Review = mongoose.model('Review', reviewSchema);

module.exports = { Review, validateReview, validateReply };