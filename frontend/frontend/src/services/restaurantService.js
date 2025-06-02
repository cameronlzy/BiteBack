import { convertOpeningHoursToSGT, convertSlotTimesToSGT, convertOpeningHoursToString } from "@/utils/timeConverter"
import http from "./httpService"

const apiEndpoint = import.meta.env.VITE_API_URL + "/restaurants"

function getRestaurantUrl(id) {
    return `${apiEndpoint}` + "/" + id
}
export async function getRestaurants() {
  const { data } = await http.get(apiEndpoint)
  return data.map((r) => ({
    ...r,
    openingHours: r.openingHours
      ? convertOpeningHoursToSGT(r.openingHours)
      : r.openingHours,
  }))
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
  try {
    const { data } = await http.get(`${apiEndpoint}/${restaurantId}/availability?date=${date}`)
    if (!Array.isArray(data)) return []
    return convertSlotTimesToSGT(data, date)
  } catch (err) {
    console.error("Failed to get availability", err)
    return []
  }
}

export function userOwnsRestaurant(restID, user) {
  const { data } = Array.isArray(user.restaurants) && user.restaurants.some(r => String(r._id) === String(restID))
  return data
}

export async function saveRestaurant(restaurant) {
    const body = { ...restaurant }

    if (body.openingHours && typeof body.openingHours === "object") {
      body.openingHours = convertOpeningHoursToString(body.openingHours)
    }


    if(restaurant._id) {
        delete body._id;
        const { data } = await http.put(getRestaurantUrl(restaurant._id), body)
        return data
    } else {
        const { data } = await http.post(apiEndpoint, body)
        return data
    }
}

export async function deleteRestaurant(id) {
    const { data } = await http.delete(getRestaurantUrl(id))
    return data
}