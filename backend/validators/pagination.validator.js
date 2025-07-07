import Joi from 'joi';

export const paginationSchema = Joi.object({
    page: Joi.number().integer().min(1).required(),
    limit: Joi.number().integer().min(1).required(),
});

export default function validatePagination(query) {
    return paginationSchema.validate(query);
}
