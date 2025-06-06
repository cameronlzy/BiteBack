import isEqual from 'lodash.isequal'

export const objectComparator = (original, updated) => {
  const result = {}

  if (original && typeof original === "object" && "profile" in original) {
    original = flattenUser(original)
  }

  if (!original || !updated) return updated || {}

  Object.entries(original).forEach(([key, value]) => {
    if (key in updated && !isEqual(value, updated[key])) {
      result[key] = updated[key]
    }
  })

  return result
}

const flattenUser = (user) => {
  const { _id, profile = {}, ...rest } = user;
  const { _id: profileId, ...flattenedProfile } = profile;

  return {
    ...rest,
    ...flattenedProfile,
  };
};