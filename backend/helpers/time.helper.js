const { DateTime } = require("luxon");
const Joi = require('joi');

// validates only iso full strings
const fullISORegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|([+-]\d{2}:\d{2}))?$/;
const dateFullOnly = Joi.string()
  .pattern(fullISORegex)
  .custom((value, helpers) => {
    const dt = DateTime.fromISO(value, { setZone: true });
    if (!dt.isValid) return helpers.error('any.invalid');
    const now = DateTime.now();
    if (dt < now) return helpers.error('date.min', { limit: now.toISO() });
    return value;
}, 'Strict full ISO datetime validation');


// validates full and partial iso strings
const dateAllowPartial = Joi.string().custom((value, helpers) => {
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
const ISOdate = Joi.string()
  .isoDate()
  .messages({
    'string.base': 'Date must be a string.',
    'string.isoDate': 'Date must be a valid ISO 8601 date string.',
    'any.required': 'Date is required.'
  });

const convertToUTCStart = (isoDate) => {
  return DateTime.fromISO(isoDate, { zone: 'Asia/Singapore' }).startOf('day').toUTC().toJSDate();
};

const convertToUTCEnd = (isoDate) => {
  return DateTime.fromISO(isoDate, { zone: 'Asia/Singapore' }).endOf('day').toUTC().toJSDate();
};

const convertToUTC = (isoDate) => {
  return DateTime.fromISO(isoDate, { zone: 'Asia/Singapore' }).toUTC().toJSDate();
};


module.exports = { 
  dateFullOnly, 
  dateAllowPartial, 
  ISOdate,
  convertToUTCStart,
  convertToUTCEnd,
  convertToUTC,
};