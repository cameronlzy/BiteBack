const Joi = require('joi');

function validateEntry(entry) {
    const schema = Joi.object({
        restaurant: Joi.objectId().required(),
        pax: Joi.number().integer().min(1).required(),
    });
    return schema.validate(entry);
}

module.exports = {
    validateEntry,
};