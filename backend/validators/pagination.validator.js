import Joi from 'joi';

export default function validatePagination(query) {
    const schema = Joi.object({
        page: Joi.number().integer().min(1).required(),
        limit: Joi.number().integer().min(1).required(),
    });

    return schema.validate(query);
}
