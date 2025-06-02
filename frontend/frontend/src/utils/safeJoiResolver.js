 export const safeJoiResolver = (schema) => async (values) => {
    const { error, value } = schema.validate(values, { abortEarly: false })

    if (!error) return { values: value, errors: {} }

    if (!error.details) {
      console.error("Malformed Joi error:", error)
      return { values: {}, errors: {} }
    }

    const formErrors = error.details.reduce((acc, curr) => {
      const path = curr.path.join(".")
      acc[path] = {
        type: curr.type,
        message: curr.message,
      }
      return acc
    }, {})

    return { values: {}, errors: formErrors }
  }