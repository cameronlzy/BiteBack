import Joi from 'joi';

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