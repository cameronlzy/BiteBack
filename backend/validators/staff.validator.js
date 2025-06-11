import Joi from 'joi';
import passwordComplexity from 'joi-password-complexity';

export function validateStaffLogin(credentials) {
    const schema = Joi.object({
        username: Joi.string().min(2).required(),
        password: passwordComplexity().required()
    });
    return schema.validate(credentials);
}