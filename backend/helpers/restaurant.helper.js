const { DateTime } = require('luxon');

function convertSGTOpeningHoursToUTC(openingHoursString) {
  const days = openingHoursString.split('|');

  const converted = days.map(entry => {
    if (entry === 'x') return 'x';

    const [start, end] = entry.split('-');

    const startTime = DateTime.fromFormat(start, 'HH:mm', { zone: 'Asia/Singapore' }).toUTC();
    const endTime = DateTime.fromFormat(end, 'HH:mm', { zone: 'Asia/Singapore' }).toUTC();

    return `${startTime.toFormat('HH:mm')}-${endTime.toFormat('HH:mm')}`;
  });

  return converted.join('|');
}

function createSlots(openingHoursString, sgtDateTime, slotDuration = 60) {
  const openingHours = openingHoursString.split('|');
  const date = sgtDateTime;
  const weekdayIndex = sgtDateTime.weekday - 1; 

  const dayHours = openingHours[weekdayIndex];
  if (!dayHours || dayHours.toLowerCase() === 'x') return [];

  const [openStr, closeStr] = dayHours.split('-');
  const openTime = DateTime.fromFormat(openStr, 'HH:mm', { zone: 'utc' })
    .set({ year: date.year, month: date.month, day: date.day });

  const closeTime = DateTime.fromFormat(closeStr, 'HH:mm', { zone: 'utc' })
    .set({ year: date.year, month: date.month, day: date.day });

  const slots = [];
  let slotStart = openTime;

  while (slotStart.plus({ minutes: slotDuration }) <= closeTime) {
    slots.push(slotStart.toFormat('HH:mm'));
    slotStart = slotStart.plus({ minutes: slotDuration });
  }

  return slots;
}

module.exports = { convertSGTOpeningHoursToUTC, createSlots };