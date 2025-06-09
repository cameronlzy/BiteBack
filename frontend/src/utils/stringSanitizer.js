export function sanitizeStrings(obj) {
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
    return obj
  }

  const sanitized = {}

  for (const key in obj) {
    const value = obj[key]
    if (typeof value === "string") {
      sanitized[key] = value.trim()
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeStrings(value) 
    } else {
      sanitized[key] = value
    }
  }

  return sanitized
}