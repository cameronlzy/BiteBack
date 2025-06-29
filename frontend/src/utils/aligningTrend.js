import { DateTime } from "luxon"

const weekdayKeys = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
]

export function alignTrendsToWeekdays(entries, openingHours) {
  return weekdayKeys.map(weekday => {
    if (openingHours[weekday] === "Closed") return null
    return entries.find(e =>
      DateTime.fromISO(e.startDate).toFormat("cccc") === weekday
    ) || "closed"
  })
}