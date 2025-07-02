import { DateTime } from 'luxon';
import Joi from 'joi';

// validates only iso full strings (must be in the future)
const fullISORegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,})?)?(Z|[+-]\d{2}:\d{2})?$/;

export const futureDateFullOnly = Joi.string()
  .pattern(fullISORegex)
  .custom((value, helpers) => {
    const dt = DateTime.fromISO(value, { setZone: true });
    if (!dt.isValid) return helpers.error('any.invalid');
    const now = DateTime.now();
    if (dt < now) return helpers.error('custom.date.min', { limit: now.toISO() });
    return value;
}, 'Strict full ISO datetime validation')
  .messages({
    'any.invalid': 'Date must be a valid ISO string',
    'string.pattern.base': 'Date must match full ISO format',
    'custom.date.min': 'Date cannot be in the past (min: {#limit})'
  });

export const dateFullOnly = Joi.string()
  .pattern(fullISORegex)
  .custom((value, helpers) => {
    const dt = DateTime.fromISO(value, { setZone: true });
    if (!dt.isValid) return helpers.error('any.invalid');
    return value;
}, 'Strict full ISO datetime validation')
  .messages({
    'any.invalid': 'Date must be a valid ISO string',
    'string.pattern.base': 'Date must match full ISO format',
  });

export const timeString = Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/).message('Time must be in HH:mm format (00:00 - 23:59)');
