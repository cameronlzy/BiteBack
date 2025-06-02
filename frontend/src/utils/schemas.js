import Joi from "joi"
import { dateAllowPartial }  from "./dateUtil"

const passwordComplexity = Joi.string()
  .min(8)
  .max(26)
  .pattern(/[a-z]/, "lowercase")
  .pattern(/[A-Z]/, "uppercase")
  .pattern(/[0-9]/, "numeric")
  .pattern(/[^a-zA-Z0-9]/, "symbol")
  .required()

const objectId = Joi.string().pattern(/^[0-9a-fA-F]{24}$/).messages({
  "string.pattern.base": "Invalid ID format. Must be a 24-character hex string.",
})
const passwordMessages = {
  "string.min": "Password must be at least 8 characters.",
  "string.max": "Password must not exceed 26 characters.",
  "string.pattern.name": "Password must include a {#name} character.",
  "string.empty": "Password is required.",
  "any.required": "Password is required.",
}

const timePattern = /^([01]\d|2[0-3]):[0-5]\d-([01]\d|2[0-3]):[0-5]\d$|^Closed$/
const websitePattern = /^(https?:\/\/)?(www\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}([/?].*)?$/;

const dailyTimeSchema = Joi.string()
  .pattern(timePattern)
  .required()
  .custom((value, helpers) => {
    if (!value || typeof value !== "string") return helpers.message("Invalid time format")

    if (value.toLowerCase() === "closed") return value

    const [start, end] = value.split("-")

    if (!start || !end) {
      return helpers.message('Time must be in HH:MM-HH:MM format or "Closed"')
    }

    const [startHour, startMin] = start.split(":").map(Number)
    const [endHour, endMin] = end.split(":").map(Number)

    const startMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin

    if (startMinutes >= endMinutes) {
      return helpers.message("Opening time must be before closing time")
    }

    return value
  })
  .messages({
    "string.pattern.base": 'Time must be in HH:MM-HH:MM format or "Closed"',
    "string.empty": "Time is required",
    "any.required": "Time is required",
  })

export const cuisineList = [
  "Chinese", "Malay", "Indian", "Peranakan", "Western", "Thai",
  "Korean", "Vietnamese", "Indonesian", "Filipino", "Middle Eastern",
  "Mexican", "Italian", "French", "Hawker", "Fusion", "Seafood",
  "Vegetarian", "Halal", "Japanese"
]

export const restaurantSchema = Joi.object({
  id:  objectId.optional(), 
  name: Joi.string().min(2).max(20).required().messages({
    "string.min": "Restaurant name must be at least 2 characters.",
    "string.max": "Restaurant name must not exceed 20 characters.",
    "string.empty": "Restaurant name is required.",
    "any.required": "Restaurant name is required.",
  }),
  address: Joi.string().min(2).max(255).required().messages({
    "string.min": "Address must be at least 2 characters.",
    "string.empty": "Address is required.",
    "any.required": "Address is required.",
  }),
  contactNumber: Joi.string().pattern(/^\d{8}$/).required().messages({
    "string.pattern.base": "Contact number must be an 8-digit number.",
    "string.empty": "Contact number is required.",
    "any.required": "Contact number is required.",
  }),
  cuisines: Joi.array().items(Joi.string().valid(...cuisineList)).min(1).required().messages({
    "array.min": "Please select at least one cuisine.",
    "any.required": "Cuisines are required.",
  }),
  openingHours: Joi.object({
    monday: dailyTimeSchema,
    tuesday: dailyTimeSchema,
    wednesday: dailyTimeSchema,
    thursday: dailyTimeSchema,
    friday: dailyTimeSchema,
    saturday: dailyTimeSchema,
    sunday: dailyTimeSchema,
  }),
  maxCapacity: Joi.number().integer().min(0).max(1000).required().messages({
    "number.base": "Max capacity must be a number.",
    "number.integer": "Max capacity must be an integer.",
    "number.min": "Max capacity must be at least 0.",
    "number.max": "Max capacity must not exceed 1000.",
    "any.required": "Max capacity is required.",
  }),
  email: Joi.string().email({ tlds: { allow: false } }).allow("").optional().messages({
    "string.email": "Please enter a valid email address.",
  }),
  website: Joi.string()
  .pattern(websitePattern)
  .allow("") 
  .optional()
  .messages({
    "string.pattern.base": "Please enter a valid website URL (e.g. https://example.com).",
  }),
})

export const ownerSchema = Joi.object({
  username: Joi.string().min(2).max(20).required().messages({
    "any.required": "Username is required.",
    "string.empty": "Username is required.",
    "string.min": "Username must be at least 2 characters.",
    "string.max": "Username must not exceed 20 characters.",
  }),
  email: Joi.string().email({ tlds: { allow: false } }).required().messages({
    "string.email": "Please enter a valid email address.",
    "string.empty": "Email is required.",
    "any.required": "Email is required.",
  }),
  password: passwordComplexity.required().messages(passwordMessages),
  confirmPassword: Joi.any().valid(Joi.ref("password")).required().messages({
    "any.only": "Passwords do not match.",
    "string.empty": "Confirm password is required.",
    "any.required": "Confirm password is required.",
  }),
  role: Joi.string().valid("owner").required(),
  companyName: Joi.string().min(2).max(255).required().messages({
    "string.min": "Company name must be at least 2 characters.",
    "string.max": "Company name must not exceed 255 characters.",
    "string.empty": "Company name is required.",
    "any.required": "Company name is required.",
  }),
  restaurants: Joi.array().items(restaurantSchema).required().messages({
    "array.min": "Please add at least one restaurant.",
    "any.required": "Restaurants are required.",
  }),
})

export const customerSchema = Joi.object({
  username: Joi.string().min(2).max(20).required().messages({
    "string.min": "Username must be at least 2 characters.",
    "string.max": "Username must not exceed 20 characters.",
    "string.empty": "Username is required.",
    "any.required": "Username is required.",
  }),
  email: Joi.string().email({ tlds: { allow: false } }).required().messages({
    "string.email": "Please enter a valid email address.",
    "any.required": "Email is required.",
    "string.empty": "Email is required.",
  }),
  password: passwordComplexity.required().messages(passwordMessages),
  confirmPassword: Joi.any().valid(Joi.ref("password")).required().messages({
    "any.only": "Passwords do not match.",
    "any.required": "Confirm password is required.",
  }),
  role: Joi.string().valid("customer").required(),
  name: Joi.string().min(2).max(20).required().messages({
    "string.min": "Name must be at least 2 characters.",
    "string.max": "Name must not exceed 20 characters.",
    "string.empty": "Name is required.",
    "any.required": "Name is required.",
  }),
  contactNumber: Joi.string().pattern(/^\d{8}$/).required().messages({
    "string.pattern.base": "Contact number must be an 8-digit number.",
    "string.empty": "Contact number is required.",
    "any.required": "Contact number is required.",
  }),
  favCuisines: Joi.array().items(Joi.string().valid(...cuisineList)).min(1).required().messages({
    "array.min": "Please select at least one favourite cuisine.",
    "any.required": "Favourite cuisines are required.",
  }),
})

export const loginUserSchema = Joi.object({
  identifier: Joi.string()
    .required()
    .custom((value, helpers) => {
      const isEmail =
        Joi.string()
          .email({ tlds: { allow: false } })
          .validate(value).error === undefined
      const isUsername =
        Joi.string().min(2).max(20).validate(value).error === undefined

      if (isEmail || isUsername) return value

      return helpers.error("any.invalid")
    })
    .messages({
      "string.empty": "Username or Email is required.",
      "any.required": "Username or Email is required.",
      "any.invalid": "Must be a valid email or username (2–20 characters).",
    }),
  password: passwordComplexity.required().messages(passwordMessages),
})

export const reservationSchema = Joi.object({
  id:  Joi.string().optional(), // RMB ADD the objectID pattern ltr
  userId: objectId.required(),
  restaurantId: objectId.required(),
  reservationDate: Joi.date().greater("now").iso().required().messages({
    "any.required": "Reservation Date and Time required",
    "date.greater": "Reservation must be in the future",
    "date.base": "Invalid date format",
  }),
  pax: Joi.number().integer().min(1).required().messages({
    "number.base": "Guests must be a number.",
    "number.min": "Guests must be at least 1.",
    "number.max": "Guests must not exceed 10.",
    "any.required": "Please select the number of guests.",
  }),
  remarks: Joi.string().allow('').custom((value, helpers) => {
    if (value.trim() === '') return value;
    const wordCount = value.trim().split(/\s+/).length;
    if (wordCount > 50) {
      return helpers.message('Remarks must not exceed 50 words');
    }
    return value;
  }).required()
});

export const reviewSchema =  Joi.object({
  restaurant: objectId.required(),
  rating: Joi.number().integer().min(0).max(5).required().messages({
  "number.base": "Rating must be a number",
  "number.integer": "Rating must be an integer",
  "number.min": "Rating must be at least 0",
  "number.max": "Rating cannot exceed 5",
   "any.required": "Rating is required",
   }),
  reviewText: Joi.string().allow('').min(0).max(1000).required().messages({
    "string.base": "Review must be a string",
    "string.max": "Review cannot exceed 1000 characters",
  }),
  dateVisited: Joi.string().isoDate().required().messages({
    "string.base": "Date must be a string",
    "string.isoDate": "Date must be in ISO format (YYYY-MM-DD or full ISO date)",
    "any.required": "Date visited is required",
  })
});



