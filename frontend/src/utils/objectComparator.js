import isEqual from "lodash.isequal"
import { DateTime } from "luxon"

const DATE_KEYS = ["startDate", "endDate"]

const flattenUser = (user) => {
  const { _id, profile, ...rest } = user
  const { _id: _profileId, ...flattenedProfile } = profile

  return {
    ...rest,
    ...flattenedProfile,
  }
}

export const objectComparator = (
  original,
  updated,
  type = null,
  originalStartDateTime = null,
  originalEndDateTime = null
) => {
  const result = {}

  if (original && typeof original === "object" && "profile" in original) {
    original = flattenUser(original)
  }

  if (!original || !updated) return updated || {}

  Object.entries(original).forEach(([key, value]) => {
    if (key in updated) {
      let v1 = value
      let v2 = updated[key]

      if (type === "promotion" && (key === "startDate" || key === "endDate")) {
        const originalDateTime = DateTime.fromISO(
          key === "startDate" ? originalStartDateTime : originalEndDateTime
        )

        const updatedDate = DateTime.fromISO(v2)
        const mergedDateTime = updatedDate.set({
          hour: originalDateTime.hour,
          minute: originalDateTime.minute,
          second: originalDateTime.second,
          millisecond: originalDateTime.millisecond,
        })

        v2 = mergedDateTime.toISO()
        v1 = originalDateTime.toISO()

        if (!isEqual(v1, v2)) {
          result[key] = v2
        }

        return
      }

      if (DATE_KEYS.includes(key)) {
        v1 = DateTime.fromISO(v1).toISO()
        v2 = DateTime.fromISO(v2).toISO()
      }

      if (!isEqual(v1, v2)) {
        result[key] = updated[key]
      }
    }
  })

  if (
    type === "promotion" &&
    "timeWindow" in updated &&
    (!("timeWindow" in original) || !isEqual(updated.timeWindow, original.timeWindow))
  ) {
    result.timeWindow = updated.timeWindow
  }

  return result
}

export const objectCleaner = (payload) => {
  const cleaned = Object.fromEntries(
    Object.entries(payload).filter(([_, v]) => v !== "")
  )
  return cleaned
}