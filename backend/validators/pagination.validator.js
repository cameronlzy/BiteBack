import Joi from 'joi';

export const paginationSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(8),
});

export default function validatePagination(query) {
    return paginationSchema.validate(query);
}
