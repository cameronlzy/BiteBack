import { convertOpeningHoursToSGT, convertSlotTimesToSGT, convertOpeningHoursToString } from "@/utils/timeConverter"
import http from "./httpService"
import { sanitizeStrings } from "@/utils/stringSanitizer"

const apiEndpoint = import.meta.env.VITE_API_URL + "/restaurants"

function getRestaurantUrl(id) {
    return `${apiEndpoint}` + "/" + id
}
export async function getRestaurants(params) {
  const { data } = await http.get(apiEndpoint, { params })
  return data 
}

export async function getRestaurant(id) {
  const { data } = await http.get(getRestaurantUrl(id))
  if (data.openingHours) {
    data.openingHours = convertOpeningHoursToSGT(data.openingHours)
  }
  return data
}

export async function getOwnerRestaurants() {
  const { data } = await http.get(apiEndpoint + "/owner")
  return data.map((r) => ({
    ...r,
    openingHours: r.openingHours
      ? convertOpeningHoursToSGT(r.openingHours)
      : r.openingHours,
  }))
}

export async function getRestaurantAvailability(restaurantId, date) {
  const encoded = encodeURIComponent(date)
  try {
    const { data } = await http.get(`${apiEndpoint}/${restaurantId}/availability?date=${encoded}`)
    if (!Array.isArray(data)) return []
    const result = convertSlotTimesToSGT(data, date)
    return result
  } catch {
    return []
  }
}

export function userOwnsRestaurant(restID, user) {
  const { data } = Array.isArray(user.restaurants) && user.restaurants.some(r => String(r._id) === String(restID))
  return data
}

export async function saveRestaurant(restaurant, isUpdate) {
    const body = { ...restaurant }

    if (body.openingHours && typeof body.openingHours === "object") {
      body.openingHours = convertOpeningHoursToString(body.openingHours)
    }


    if(isUpdate) {
      const result = {...body}
        delete result._id
        const { data } = await http.patch(getRestaurantUrl(restaurant._id), result)
        return data
    } else {
        const { data } = await http.post(apiEndpoint, body)
        return data
    }
}

export async function saveRestaurants(restaurants) {
  const results = restaurants.map((r) => {
  const cleaned = objectCleaner(r)
  const sanitized = sanitizeStrings(cleaned)

  return {
    ...sanitized,
    openingHours: convertOpeningHoursToString(r.openingHours),
  }
})

  const { data } = await http.post(apiEndpoint + "/bulk", {
    restaurants: results
})
  return data
}

export async function uploadRestaurantImages(restaurantId, files) {
  if (!restaurantId) throw new Error("Restaurant ID is required")
  if (!files || files.length === 0) return []


  const limitedFiles = files.slice(0, 5)

  for (const file of limitedFiles) {
    if (file.size > 5 * 1024 * 1024) {
      throw new Error(`File "${file.name}" exceeds 5MB limit.`)
    }
    if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
      throw new Error(`Unsupported format for "${file.name}".`)
    }
  }

  const formData = new FormData()
  limitedFiles.forEach((file) => formData.append("images", file))

  const { data: imageUrls }  = await http.post(`${apiEndpoint}/${restaurantId}/images`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  })

  return imageUrls 
}

export async function updateRestaurantImages(restaurantId, imageUrls) {
  const { data } = await http.put(`${apiEndpoint}/${restaurantId}/images`, {
    images: imageUrls,
  })
  return data
}

export async function deleteRestaurant(id) {
    const { data } = await http.delete(getRestaurantUrl(id))
    return data
}

export async function getFilteredRestaurants(params) {
  const queryString = Object.entries(params)
  .filter(
    ([_ignore, value]) =>
      value !== "" &&
      value !== null &&
      value !== undefined &&
      !(Array.isArray(value) && value.length === 0)
  )
  .map(([key, value]) =>
    `${encodeURIComponent(key)}=${encodeURIComponent(
      Array.isArray(value) ? value.join(",") : value
    )}`
  )
  .join("&")

  const { data } = await http.get(`${apiEndpoint}/discover?${queryString}`)
  return data
}


export async function getCustomerVisitCount(restaurantId) {
  const { data } = await http.get(`${apiEndpoint}/${restaurantId}/visits`)
  return data
}