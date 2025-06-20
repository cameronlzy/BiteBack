import { DateTime } from "luxon"

export const toSGT = (utcString) =>
  DateTime.fromISO(utcString, { zone: "utc" }).setZone("Asia/Singapore")

export const convertSlotTimesToSGT = (slots, reservationDate) =>
  slots.map((s) => ({
    ...s,
    time: DateTime.fromISO(`${reservationDate}T${s.time}:00`, { zone: "utc" })
      .setZone("Asia/Singapore")
      .toFormat("HH:mm"),
  }))

export const readableTimeSettings = {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: "Asia/Singapore",
}

export function convertOpeningHoursToSGT(input) {
  const days = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ]

  const segments = input.split("|")
  const result = {}

  days.forEach((day, i) => {
    const range = segments[i]
    if (!range || range.toLowerCase() === "x") {
      result[day] = "Closed"
    } else {
      const [start, end] = range.split("-")
      const convertToSGT = (t) =>
        DateTime.fromISO(`2025-01-01T${t}:00`, { zone: "utc" })
          .setZone("Asia/Singapore")
          .toFormat("HH:mm")

      result[day] = `${convertToSGT(start)}-${convertToSGT(end)}`
    }
  })

  return result
}

export function convertOpeningHoursToString(openingHours) {
  const days = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ]

  const segments = days.map((day) => {
    const range = openingHours[day]
    if (!range || range.toLowerCase() === "closed") return "x"
    return range 
  })

  return segments.join("|")
}

export const isWithinOpeningHours = (openingHours) => {
  if (!openingHours) return false;
  
  const now = DateTime.now().setZone("Asia/Singapore");
  const currentDay = now.weekdayLong.toLowerCase(); 
  
  const hours = openingHours[currentDay];
  if (!hours || hours.toLowerCase() === 'closed') return false;

  const [openStr, closeStr] = hours.split(/[-–]/).map(s => s.trim());
  
  try {
    const openTime = DateTime.fromISO(`2023-01-01T${openStr}:00`, { zone: "Asia/Singapore" });
    const closeTime = DateTime.fromISO(`2023-01-01T${closeStr}:00`, { zone: "Asia/Singapore" });
    
    const adjustedCloseTime = closeTime < openTime ? 
      closeTime.plus({ days: 1 }) : 
      closeTime;
    
    return now >= openTime && now <= adjustedCloseTime;
  } catch (e) {
    console.error("Error parsing opening hours:", e);
    return false;
  }
}
