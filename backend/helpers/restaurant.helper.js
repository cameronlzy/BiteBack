const { DateTime } = require('luxon');

exports.convertSGTOpeningHoursToUTC = (openingHoursString) => {
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

exports.createSlots = (openingHoursString, sgtDateTime, slotDuration = 60) => {
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

exports.filterOpenRestaurants = (restaurants) => {
  const nowUTC = DateTime.utc();
  const currentDay = nowUTC.weekday % 7;

  return restaurants.filter((restaurant) => {
    const days = restaurant.openingHours.split('|');
    const hoursToday = days[currentDay];
    if (!hoursToday || hoursToday.toLowerCase() === 'x') return false;

    const [startStr, endStr] = hoursToday.split('-');
    if (!startStr || !endStr) return false;

    const [startHour, startMin] = startStr.split(':').map(Number);
    const [endHour, endMin] = endStr.split(':').map(Number);

    const start = nowUTC.set({ hour: startHour, minute: startMin, second: 0 });
    const end = nowUTC.set({ hour: endHour, minute: endMin, second: 59 });

    return nowUTC >= start && nowUTC <= end;
  });
};