import Joi from "joi"

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
const passwordSchema = passwordComplexity.required().messages(passwordMessages)
const timePattern = /^([01]\d|2[0-3]):[0-5]\d-([01]\d|2[0-3]):[0-5]\d$|^Closed$/
const websitePattern = /^(https?:\/\/)?(www\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}([/?].*)?$/;
const passwordFields = {
  password: passwordSchema,
  confirmPassword: Joi.any().valid(Joi.ref("password")).required().messages({
    "any.only": "Passwords do not match.",
    "any.required": "Confirm password is required.",
  }),
}

const validIdentifier = Joi.string()
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
      "any.invalid": "Must be a valid email or username (2-20 characters).",
    })

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

const singaporePostalCodeRegex = /^\d{6}$/

export const cuisineList = [
  "Chinese", "Malay", "Indian", "Peranakan", "Western", "Thai",
  "Korean", "Vietnamese", "Indonesian", "Filipino", "Middle Eastern",
  "Mexican", "Italian", "French", "Hawker", "Fusion", "Seafood",
  "Japanese", 'Fast Food',
]

export const tagList = [
  // Features
  "Free Wi-Fi",
  "Outdoor Seating",
  "Live Music",
  "Pet Friendly",
  "Wheelchair Accessible",

  // Dietary
  "Vegan Options",
  "Gluten-Free Available",
  "Halal Certified",
  "Low Carb",
  "Nut-Free"
]

export const restaurantSchema = Joi.object({
  id:  objectId.optional(), 
  name: Joi.string().min(2).max(20).required().messages({
    "string.min": "Restaurant name must be at least 2 characters.",
    "string.max": "Restaurant name must not exceed 20 characters.",
    "string.empty": "Restaurant name is required.",
    "any.required": "Restaurant name is required.",
  }),
  blockNumber: Joi.string()
  .pattern(/^\d+[A-Za-z]?$/)
  .required()
  .messages({
    "string.pattern.base": "Block/House number must be numeric and may include a single letter (e.g., 608A).",
    "string.empty": "Block/House number is required.",
    "any.required": "Block/House number is required.",
  }),

  streetName: Joi.string().min(2).max(100).required().messages({
    "string.base": "Street name must be a string.",
    "string.empty": "Street name is required.",
    "string.min": "Street name must be at least 2 characters.",
    "any.required": "Street name is required.",
  }),

  unitNumber: Joi.string().pattern(/^#?\d{1,3}-\d{1,3}$/).allow("").optional().messages({
    "string.pattern.base": "Unit number must follow format like #05-67.",
  }),

  postalCode: Joi.string().pattern(singaporePostalCodeRegex).required().messages({
    "string.pattern.base": "Postal code must be a valid 6-digit Singapore postal code.",
    "any.required": "Postal code is required.",
    "string.empty": "Postal code is required.",
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
  features: Joi.array().items(Joi.string()).required(),
  dietary: Joi.array().items(Joi.string()).required(),
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
 isBlock: Joi.boolean()
  .required()
  .messages({
    'any.required': 'Please specify whether the address is a Block or House.',
  }),
})

export const ownerSchema = Joi.object({
  username: Joi.string().min(2).max(20).required().messages({
    "any.required": "Username is required.",
    "string.empty": "Username is required.",
    "string.min": "Username must be at least 2 characters.",
    "string.max": "Username must not exceed 20 characters.",
  }),
  email: Joi.string().allow("google-signup-bypass").email({ tlds: { allow: false } }).required().messages({
    "string.email": "Please enter a valid email address.",
    "string.empty": "Email is required.",
    "any.required": "Email is required.",
  }),
  ...passwordFields,
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
  images: Joi.array().items(Joi.string().pattern(websitePattern)).max(5).optional()
})

export const customerSchema = Joi.object({
  username: Joi.string().min(2).max(20).required().messages({
    "string.min": "Username must be at least 2 characters.",
    "string.max": "Username must not exceed 20 characters.",
    "string.empty": "Username is required.",
    "any.required": "Username is required.",
  }),
  email: Joi.string().allow("google-signup-bypass").email({ tlds: { allow: false } }).required().messages({
    "string.email": "Please enter a valid email address.",
    "any.required": "Email is required.",
    "string.empty": "Email is required.",
  }),
  ...passwordFields,
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
  emailOptOut:  Joi.boolean().required().default(false),
})

export const loginUserSchema = Joi.object({
  identifier: validIdentifier,
  password: passwordSchema,
})

export const loginStaffSchema = Joi.object({
  username: Joi.string().required().messages({
    "any.required": "Username is required.",
    "string.empty": "Username is required.",
    "string.min": "Username must be at least 2 characters.",
    "string.max": "Username must not exceed 20 characters.",
  }),
  password: passwordSchema
})

export const reservationSchema = Joi.object({
  id:  Joi.string().optional(), // RMB ADD the objectID pattern ltr
  userId: objectId.required(),
  restaurantId: objectId.required(),
  startDate: Joi.date().greater("now").iso().required().messages({
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

export const identifierSchema = Joi.object({
  identifier: validIdentifier
})

export const passwordResetSchema = Joi.object(
  passwordFields
)

export const passwordChangeSchema = Joi.object({
  ...passwordFields,
  oldPassword: passwordComplexity.required().messages({
  "string.min": "Old Password must be at least 8 characters.",
  "string.max": "Old Password must not exceed 26 characters.",
  "string.pattern.name": "Old Password must include a {#name} character.",
  "string.empty": "Old Password is required.",
  "any.required": "Old Password is required.",
})
})

export const deleteAccountSchema = Joi.object({
  password: passwordSchema
})

export const updateOwnerSchema = Joi.object({
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
  // role: Joi.string().valid("owner").required(),
  companyName: Joi.string().min(2).max(255).required().messages({
    "string.min": "Company name must be at least 2 characters.",
    "string.max": "Company name must not exceed 255 characters.",
    "string.empty": "Company name is required.",
    "any.required": "Company name is required.",
  }),
  images: Joi.array().items(Joi.string().pattern(websitePattern)).max(5).optional()
}).unknown(true);

export const updateCustomerSchema = Joi.object({
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
  // role: Joi.string().valid("customer").required(),
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
}).unknown(true);

export const filterSchema = Joi.object({
  cuisines: Joi.array().items(Joi.string()).required(),
  minRating: Joi.number().min(0).max(5).default(0),
  radius: Joi.number().min(0.1).max(10).allow(null).optional(),
  openNow: Joi.boolean().default(false),
  features: Joi.array().items(Joi.string()).required(),
  dietary: Joi.array().items(Joi.string()).required(),
  lat: Joi.number().allow(null).optional(),
  lng: Joi.number().allow(null).optional(),
})

export const promotionSchema = Joi.object({
  restaurant: Joi.string()
    .required()
    .messages({
      "any.required": "Restaurant is required.",
      "string.base": "Restaurant must be a valid string.",
    }),

  title: Joi.string()
    .min(3)
    .required()
    .messages({
      "string.empty": "Title is required.",
      "string.min": "Title must be at least 3 characters.",
      "any.required": "Title is required.",
    }),

  description: Joi.string()
    .min(5)
    .required()
    .messages({
      "string.empty": "Description is required.",
      "string.min": "Description must be at least 5 characters.",
      "any.required": "Description is required.",
    }),

  startDate: Joi.string()
    .isoDate()
    .required()
    .messages({
      "string.empty": "Start date is required.",
      "string.isoDate": "Start date must be in ISO format.",
      "any.required": "Start date is required.",
    }),

  endDate: Joi.string()
    .isoDate()
    .required()
    .messages({
      "string.empty": "End date is required.",
      "string.isoDate": "End date must be in ISO format.",
      "any.required": "End date is required.",
    }),

  timeWindow: Joi.object({
    startTime: Joi.string()
      .pattern(/^\d{2}:\d{2}$/)
      .allow("")
      .optional()
      .messages({
        "string.pattern.base": "Start time must be in HH:mm format (e.g. 09:00).",
        "string.base": "Start time must be a string.",
      }),

    endTime: Joi.string()
      .pattern(/^\d{2}:\d{2}$/)
      .allow("")
      .optional()
      .messages({
        "string.pattern.base": "End time must be in HH:mm format (e.g. 17:30).",
        "string.base": "End time must be a string.",
      }),
  }).optional(),
})

export const pointUpdateSchema = Joi.object({
  username: Joi.string().min(2).max(20).required().messages({
    "any.required": "Username is required.",
    "string.empty": "Username is required.",
    "string.min": "Username must be at least 2 characters.",
    "string.max": "Username must not exceed 20 characters.",
  }),
  change: Joi.number().integer().min(0).required().messages({
    "number.base": "New Points must be a number.",
    "number.integer": "New Points must be an integer.",
    "number.min": "New Points must be at least 0.",
    "any.required": "New Points is required.",
  }),
})

export const rewardSchema = Joi.object({
  category: Joi.string()
    .valid("percentage", "monetary", "freeItem", "buyXgetY")
    .required()
    .messages({
      "any.only": "Category must be one of: percentage, monetary, freeItem, buyXgetY.",
      "any.required": "Category is required.",
      "string.base": "Category must be a string.",
    }),

  description: Joi.string()
    .min(5)
    .required()
    .messages({
      "string.empty": "Description is required.",
      "string.min": "Description must be at least 5 characters.",
      "any.required": "Description is required.",
    }),

  pointsRequired: Joi.number()
    .integer()
    .min(0)
    .required()
    .messages({
      "number.base": "Points must be a number.",
      "number.integer": "Points must be an integer.",
      "number.min": "Points must be at least 0.",
      "any.required": "Points are required.",
    }),

  stock: Joi.number()
  .integer()
  .min(0)
  .allow(null)
  .allow("")
  .optional()
  .messages({
    "number.base": "Stock must be a number.",
    "number.integer": "Stock must be an integer.",
    "number.min": "Stock must be at least 0.",
  }),
})

export const rewardClaimSchema = Joi.object({
  code: Joi.string().pattern(/^\d{6}$/).required().messages({
    "string.pattern.base": "Code must be a 6-digit number",
    "string.empty": "Code is required",
  }),
})

export const eventSchema = Joi.object({
  title: Joi.string().required().label("Title").messages({
    "string.empty": "Title is required",
  }),

  description: Joi.string().required().label("Description").messages({
    "string.empty": "Description is required",
  }),

  date: Joi.date().required().label("Event Date").messages({
    "date.base": "Date must be valid",
    "any.required": "Date is required",
  }),

  startTime: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .required()
    .label("Start Time")
    .messages({
      "string.empty": "Start Time is required",
      "string.pattern.base": "Start Time must be in HH:mm format",
    }),

  endTime: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .required()
    .custom((value, helpers) => {
      const { startTime } = helpers?.state?.ancestors?.[0] || {}
      if (startTime && value <= startTime) {
        return helpers.message("End Time must be after Start Time")
      }
      return value
    })
    .label("End Time")
    .messages({
      "string.empty": "End Time is required",
      "string.pattern.base": "End Time must be in HH:mm format",
    }),

  paxLimit: Joi.number()
    .min(1)
    .required()
    .label("Total Pax Limit")
    .messages({
      "number.base": "Total Pax Limit must be a number",
      "number.min": "Total Pax Limit must be at least 1",
      "any.required": "Total Pax Limit is required",
    }),

  maxPaxPerCustomer: Joi.number()
    .min(1)
    .required()
    .label("Max Guests per Booking")
    .messages({
      "number.base": "Max Guests per Booking must be a number",
      "number.min": "Max Guests per Booking must be at least 1",
      "any.required": "Max Guests per Booking is required",
    }),

  slotPax: Joi.number()
    .integer()
    .min(1)
    .required()
    .custom((value, helpers) => {
      const { restaurant } = helpers?.state?.ancestors?.[0] || {}
      const maxCap = restaurant?.maxCapacity
      if (maxCap && value > maxCap) {
        return helpers.message(
          `Slot Pax cannot exceed restaurant max capacity (${maxCap})`
        )
      }
      return value
    })
    .label("Slot Pax")
    .messages({
      "number.base": "Slot Pax must be a number",
      "number.min": "Slot Pax must be at least 1",
      "any.required": "Slot Pax is required",
    }),

  remarks: Joi.string()
    .allow("")
    .max(300)
    .label("Remarks")
    .messages({
      "string.max": "Remarks must be less than 300 characters",
    }),

  restaurant: Joi.string()
    .required()
    .label("Restaurant")
    .messages({
      "string.empty": "Restaurant is required",
      "any.required": "Restaurant is required",
    }),

  minVisits: Joi.number()
    .integer()
    .min(0)
    .optional()
    .label("Minimum Visits")
})

export const joinEventSchema = Joi.object({
  pax: Joi.number().integer().min(1).required().messages({
    "number.base": "Pax must be a number",
    "number.min": "Minimum 1 pax required",
    "any.required": "Pax is required",
  }),
  remarks: Joi.string().allow("").max(500),
})

export const menuCategoryList = [
  { value: "appetisers", label: "Appetisers" },
  { value: "mains", label: "Mains" },
  { value: "desserts", label: "Desserts" },
  { value: "drinks", label: "Drinks" },
  { value: "kids-menu", label: "Kids Menu" },
  { value: "specials", label: "Specials" },
]

export const itemSchema = Joi.object({
  restaurant: Joi.string()
    .required()
    .messages({
      "any.required": "Restaurant ID is required",
      "string.base": "Restaurant ID must be a string",
    }),
  name: Joi.string()
    .required()
    .messages({
      "any.required": "Name is required",
      "string.base": "Name must be a string",
    }),
  description: Joi.string()
    .required()
    .messages({
      "any.required": "Description is required",
      "string.base": "Description must be a string",
    }),
 price: Joi.number()
  .min(0)
  .required()
  .custom((value, helpers) => {
    if (!/^\d+(\.\d{1,2})?$/.test(value.toString())) {
      return helpers.error("number.decimal")
    }
    return value
  })
  .messages({
    "any.required": "Price is required",
    "number.base": "Price must be a number",
    "number.min": "Price must be at least 0",
    "number.decimal": "Price must have at most 2 decimal places",
  }),
  category: Joi.string()
    .required()
    .messages({
      "any.required": "Category is required",
      "string.empty": "Category is required",
      "string.base": "Category must be a string",
    }),
})