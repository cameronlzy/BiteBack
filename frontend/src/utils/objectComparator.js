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

export const objectComparator = (original, updated) => {
  const result = {}

  if (original && typeof original === "object" && "profile" in original) {
    original = flattenUser(original)
  }

  if (!original || !updated) return updated || {}

  Object.entries(original).forEach(([key, value]) => {
    if (key in updated) {
      let v1 = value
      let v2 = updated[key]

      if (DATE_KEYS.includes(key)) {
        v1 = DateTime.fromISO(value).toISO()
        v2 = DateTime.fromISO(v2).toISO()
      }

      if (!isEqual(v1, v2)) {
        result[key] = updated[key]
      }
    }
  })

  return result
}

export const objectCleaner = (payload) => {
  const cleaned = Object.fromEntries(
    Object.entries(payload).filter(([_, v]) => v !== "")
  )
  return cleaned
}