import { DateTime } from "luxon"

export const toSGT = (utcString) =>
  DateTime.fromISO(utcString, { zone: "utc" }).setZone("Asia/Singapore")

export const toSGTISO = (utcString) => DateTime.fromISO(utcString, { zone: "Asia/Singapore" }).toISO()

export const convertSlotTimesToSGT = (slots, reservationDate) => {
  const dateOnly = DateTime.fromISO(reservationDate, { zone: "utc" }).toFormat("yyyy-MM-dd")
  return slots.map((s) => ({
    ...s,
    time: DateTime.fromISO(`${dateOnly}T${s.time}:00`, { zone: "utc" })
      .setZone("Asia/Singapore")
      .toFormat("HH:mm"),
  }))
}

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

export const convertOpeningHoursToSGT = (input) => {
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

      result[day] = `${convertTimeToSGT(start)}-${convertTimeToSGT(end)}`
    }
  })

  return result
}

export const convertToSGT = (isoDateStr) => {
  return DateTime.fromISO(isoDateStr, { zone: "utc" })
    .setZone("Asia/Singapore")
    .toISO()
}

export const convertTimeToSGT = (timeStr) => {
  return DateTime.fromISO(`2025-01-01T${timeStr}:00`, { zone: "utc" })
    .setZone("Asia/Singapore")
    .toFormat("HH:mm")
}

export const dateConverter = (item) => {
  const fields = ["startDate", "endDate", "createdAt"]
  fields.forEach((f) => {
    if (item[f]) item[f] = convertToSGT(item[f])
  })
  return item
}

export const convertOpeningHoursToString = (openingHours) => {
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

export const isOpenToday = (restaurant) => {
  if (!restaurant?.openingHours) return false

  const now = DateTime.now().setZone("Asia/Singapore")
  const currentDay = now.weekdayLong.toLowerCase()
  const hours = restaurant.openingHours[currentDay]

  return !!hours && hours.toLowerCase() !== "closed"
}

export const isWithinOpeningHours = (openingHours) => {
  if (!openingHours) return false;
  
  const now = DateTime.now().setZone("Asia/Singapore");
  const currentDay = now.weekdayLong.toLowerCase(); 
  
  const hours = openingHours[currentDay];
  if (!hours || hours.toLowerCase() === 'closed') return false;

  const [openStr, closeStr] = hours.split(/[--]/).map(s => s.trim());
  
  try {

    const openTime = DateTime.fromFormat(openStr, "HH:mm", {
      zone: "Asia/Singapore",
    }).set({
      year: now.year,
      month: now.month,
      day: now.day,
    })

    let closeTime = DateTime.fromFormat(closeStr, "HH:mm", {
      zone: "Asia/Singapore",
    }).set({
      year: now.year,
      month: now.month,
      day: now.day,
    })
    
    
    const adjustedCloseTime = closeTime < openTime ? 
      closeTime.plus({ days: 1 }) : 
      closeTime;
    
    return now >= openTime && now <= adjustedCloseTime;
  } catch (e) {
    console.error("Error parsing opening hours:", e);
    return false;
  }
}

export const isPromotionAvailable = (promotion) => {
  const now = DateTime.now().setZone("Asia/Singapore")

  if (promotion.timeWindow?.startTime && promotion.timeWindow?.endTime) {
    const dummyDate = { year: 1970, month: 1, day: 1 }

    const nowTime = now.set(dummyDate)
    const startTime = DateTime.fromFormat(promotion.timeWindow.startTime, "HH:mm", {
      zone: "Asia/Singapore",
    }).set(dummyDate)

    const endTime = DateTime.fromFormat(promotion.timeWindow.endTime, "HH:mm", {
      zone: "Asia/Singapore",
    }).set(dummyDate)

    if (endTime > startTime) {
      return nowTime >= startTime && nowTime <= endTime
    } else {
      return nowTime >= startTime || nowTime <= endTime
    }
  }

  return true 
}

export const hasItemStarted = (item) => {
  const now = DateTime.now().setZone("Asia/Singapore")
  const start = DateTime.fromISO(item.startDate).setZone("Asia/Singapore")
  return now >= start
}

export const hasItemEnded = (item) => {
  const now = DateTime.now().setZone("Asia/Singapore")
  const end = DateTime.fromISO(item.endDate).setZone("Asia/Singapore")
  return end <= now
}

export const isRestaurantClosed = (restaurant, date) => {
  if (!restaurant?.openingHours) return false

  const day = date.toLocaleDateString("en-SG", {
    weekday: "long",
    timeZone: "Asia/Singapore",
  }).toLowerCase()

  return restaurant.openingHours[day]?.toLowerCase() === "closed"
}

export const isRestaurantNotOpenYet = (restaurant) => {
  if (!restaurant?.openingHours) return true

  const now = DateTime.now().setZone("Asia/Singapore")
  const weekday = now.weekdayLong.toLowerCase()
  const hoursString = restaurant.openingHours[weekday]

  if (!hoursString || hoursString.toLowerCase() === "closed") return true

  const nowTime = now.toFormat("HH:mm")
  const [startTime] = hoursString.split("-")

  return nowTime < startTime
}

export const computeDateWithOptionalTime = (dateISO, time, isStart) => {
  const dt = DateTime.fromISO(dateISO, { zone: "Asia/Singapore" })

  if (time?.trim()) {
    const [hour, minute] = time.split(":").map(Number)
    return dt.set({ hour, minute }).toISO()
  }

  return isStart ? dt.startOf("day").toISO() : dt.endOf("day").toISO()
}