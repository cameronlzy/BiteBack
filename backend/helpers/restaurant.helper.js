const { DateTime } = require('luxon');

function convertSGTOpeningHoursToUTC(openingHours) {
  const daysOfWeek = [
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
  ];
  const result = {};

  for (const day of daysOfWeek) {
    const hours = openingHours[day];
    if (typeof hours === 'string' && hours.toLowerCase() === 'closed') {
      result[day] = 'Closed';
      continue;
    }
    const [start, end] = hours.split('-');

    // using an arbitrary date
    const dateString = '2025-01-01';
    const startUTC = DateTime.fromISO(`${dateString}T${start}`, { zone: 'Asia/Singapore' })
      .toUTC()
      .toFormat('HH:mm');
    const endUTC = DateTime.fromISO(`${dateString}T${end}`, { zone: 'Asia/Singapore' })
      .toUTC()
      .toFormat('HH:mm');

    result[day] = `${startUTC}-${endUTC}`;
  }

  return result;
}

function createSlots(restaurant, queryDate) {
  // find day of week and opening hours
  // make sure that it works if it loops over a day
  const dayOfWeek = queryDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const timeRange = restaurant.openingHours[dayOfWeek];
  const slotDuration = restaurant.slotDuration;

  if (!timeRange || timeRange == "Closed") return null;
  const [startTime, endTime] = timeRange.split('-');

  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  const slots = [];

  const start = new Date();
  start.setHours(startHour, startMin, 0, 0);

  const end = new Date();
  end.setHours(endHour, endMin, 0, 0);

  let current = new Date(start);

  while (current < end) {
    const hours = String(current.getHours()).padStart(2, '0');
    const minutes = String(current.getMinutes()).padStart(2, '0');
    current = new Date(current.getTime() + slotDuration * 60000);
    if (current > end) break;
    slots.push(`${hours}:${minutes}`);
  }
  return slots;
}

module.exports = { convertSGTOpeningHoursToUTC, createSlots };