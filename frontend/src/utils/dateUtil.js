import { DateTime } from "luxon";
import Joi from "joi";
// validates only iso full strings
const fullISORegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|([+-]\d{2}:\d{2}))?$/;
export const dateFullOnly = Joi.string()
  .pattern(fullISORegex)
  .custom((value, helpers) => {
    const dt = DateTime.fromISO(value, { setZone: true });
    if (!dt.isValid) return helpers.error('any.invalid');
    const now = DateTime.now();
    if (dt < now) return helpers.error('date.min', { limit: now.toISO() });
    return value;
}, 'Strict full ISO datetime validation');


// validates full and partial iso strings
export const dateAllowPartial = Joi.string().custom((value, helpers) => {
  // Regex for YYYY-MM-DD
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/;
  // Regex for YYYY-MM-DDTHH:mm:ss (24h)
  const dateTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;

  if (dateOnly.test(value) || dateTime.test(value)) {
    return value; 
  }
  return helpers.error('any.invalid');
}, 'Date or DateTime validation');

export const isBeyond90Days = (props) => {
  const today = new Date()
  const futureLimit = new Date()
  futureLimit.setDate(today.getDate() + 90)
  return props.date.setHours(0, 0, 0, 0) > futureLimit.setHours(0, 0, 0, 0)
}