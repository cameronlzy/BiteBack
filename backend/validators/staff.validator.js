const Joi = require('joi');
const passwordComplexity = require('joi-password-complexity');

function validateStaffLogin(credentials) {
    const schema = Joi.object({
        username: Joi.string().min(2).required(),
        password: passwordComplexity().required()
    });
    return schema.validate(credentials);
}

module.exports = {
    validateStaffLogin,
};