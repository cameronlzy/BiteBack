import { DateTime } from 'luxon';

export function convertOpeningHoursToUTC(openingHoursString, timezone = 'Asia/Singapore') {
  const days = openingHoursString.split('|');

  const converted = days.map(entry => {
    if (entry === 'x') return 'x';

    const [start, end] = entry.split('-');

    const startTime = DateTime.fromFormat(start, 'HH:mm', { zone: timezone }).toUTC();
    const endTime = DateTime.fromFormat(end, 'HH:mm', { zone: timezone }).toUTC();

    return `${startTime.toFormat('HH:mm')}-${endTime.toFormat('HH:mm')}`;
  });

  return converted.join('|');
}

export function createSlots(openingHoursString, sgtDateTime, slotDuration = 60) {
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

export function filterOpenRestaurants(restaurants) {
  const now = DateTime.utc();

  return restaurants.filter((restaurant) => {
    const timezone = restaurant.timezone || 'Asia/Singapore';
    const localNow = now.setZone(timezone);
    const currentDay = localNow.weekday - 1;

    const days = restaurant.openingHours.split('|');
    const hoursToday = days[currentDay];
    if (!hoursToday || hoursToday.toLowerCase() === 'x') return false;

    const [startStr, endStr] = hoursToday.split('-');
    if (!startStr || !endStr) return false;

    const [startHour, startMin] = startStr.split(':').map(Number);
    const [endHour, endMin] = endStr.split(':').map(Number);

    const localStart = localNow.set({ hour: startHour, minute: startMin, second: 0 });
    const localEnd = localNow.set({ hour: endHour, minute: endMin, second: 59 });

    return localNow >= localStart && localNow <= localEnd;
  });
};

export function getCurrentTimeSlotStartUTC(restaurant) {
  const now = DateTime.utc();
  const today = now.startOf('day');
  const todayOpening = getOpeningHoursToday(restaurant);

  if (todayOpening === 'x') {
      // restaurant is closed today
      return null;
  }

  const [openStr, closeStr] = todayOpening.split('-');
  const [openHour, openMinute] = openStr.split(':').map(Number);
  const [closeHour, closeMinute] = closeStr.split(':').map(Number);

  const openingTime = today.set({ hour: openHour, minute: openMinute, second: 0, millisecond: 0 });
  let closingTime = today.set({ hour: closeHour, minute: closeMinute, second: 0, millisecond: 0 });

  if (closingTime <= openingTime) {
    closingTime = closingTime.plus({ days: 1 });
  }

  if (now < openingTime || now >= closingTime) {
    return null;
  }

  const minutesSinceOpen = Math.floor(now.diff(openingTime, 'minutes').minutes);
  const slotIndex = Math.floor(minutesSinceOpen / restaurant.slotDuration);
  const slotStart = openingTime.plus({ minutes: slotIndex * restaurant.slotDuration }).set({ second: 0, millisecond: 0 });

  return slotStart.toUTC(); // JS Date in UTC
}

export function getOpeningHoursToday(restaurant, timezone = 'Asia/Singapore') {
  const now = DateTime.now().setZone(timezone);
  const weekdayIndex = now.weekday - 1;

  const openingHoursArray = restaurant.openingHours.split('|');
  const todayOpening = openingHoursArray[weekdayIndex];
  return todayOpening;
}

export function getOpeningWindow(dateUTC, openingHoursStr, timezone = 'Asia/Singapore') {
  const sgtWeekday = dateUTC.setZone(timezone).weekday;
  const hoursSeg = openingHoursStr.split('|')[sgtWeekday - 1];

  if (!hoursSeg || hoursSeg.toLowerCase() === 'x') return null;

  const [openStr, closeStr] = hoursSeg.split('-');
  const [oh] = openStr.split(':').map(Number);
  let [ch, cm] = closeStr.split(':').map(Number);

  if (cm !== 0) ch += 1;
  let span = ch - oh;
  if (span <= 0) span += 24;

  return { startHourUTC: oh, spanHours: span };
}