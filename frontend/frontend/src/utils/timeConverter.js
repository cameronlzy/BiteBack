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