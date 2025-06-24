import { DateTime } from 'luxon';
import Joi from 'joi';

// validates only iso full strings
const fullISORegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|([+-]\d{2}:\d{2}))?$/;
export const dateFullOnly = Joi.string()
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


// validates full and partial iso strings
export const dateAllowPartial = Joi.string().custom((value, helpers) => {
  // Regex for YYYY-MM-DD
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/;
  // Regex for YYYY-MM-DDTHH:mm:ss (24h)
  const dateTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;

  if (dateOnly.test(value) || dateTime.test(value)) {
    return value; // valid
  }
  return helpers.error('any.invalid');
}, 'Date or DateTime validation');

// only ISO date string
export const ISOdate = Joi.string()
  .isoDate()
  .messages({
    'string.base': 'Date must be a string.',
    'string.isoDate': 'Date must be a valid ISO 8601 date string.',
    'any.required': 'Date is required.'
  });

export const timeString = Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/).message('Time must be in HH:mm format (00:00 - 23:59)');

export function convertToUTCStart(isoDate) {
  return DateTime.fromISO(isoDate, { zone: 'Asia/Singapore' }).startOf('day').toUTC().toJSDate();
}

export function convertToUTCEnd(isoDate) {
  return DateTime.fromISO(isoDate, { zone: 'Asia/Singapore' }).endOf('day').toUTC().toJSDate();
}

export function convertToUTC(isoDate) {
  return DateTime.fromISO(isoDate, { zone: 'Asia/Singapore' }).toUTC().toJSDate();
}