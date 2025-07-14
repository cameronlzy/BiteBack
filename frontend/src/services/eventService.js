import http from "./httpService"
import { dateConverter } from "@/utils/timeConverter"

const apiEndpoint = import.meta.env.VITE_API_URL + "/events"

export async function getEvents(params = {}) {
  const { data } = await http.get(apiEndpoint, { params })
  console.log(data)
  const events = data.events.map(dateConverter)
  return { ...data, events }
}

export async function getEventsByRestaurant(id, params) {
  const { data } = await http.get(`${apiEndpoint}/restaurant/${id}`, { params })
  const events = data.events.map(dateConverter)
  return { ...data, events }
}

export async function getEventById(id) {
  const { data } = await http.get(`${apiEndpoint}/${id}`)
  return dateConverter(data)
}

export async function getOwnerEvents(params) {
  const { data } = await http.get(`${apiEndpoint}/owner`, { params })
  const events = data?.events?.map(dateConverter)
  return {...data, events}
}

export async function saveEvent(event) {
  if (event._id) {
    const payload = { ...event }
    delete payload._id
    const { data } = await http.patch(`${apiEndpoint}/${event._id}`, payload)
    return data
  } else {
    const { data } = await http.post(apiEndpoint, event)
    return data
  }
}

export async function deleteEvent(id) {
  const { data } = await http.delete(`${apiEndpoint}/${id}`)
  return data
}

export async function uploadEventImages(eventId, files) {
  if (!eventId) throw new Error("Event ID is required")
  if (!files || files.length !== 2) throw new Error("Both images are required")

  const [mainImage, bannerImage] = files

  const formData = new FormData()
  formData.append("mainImage", mainImage)
  formData.append("bannerImage", bannerImage)

  const { data } = await http.post(`${apiEndpoint}/${eventId}/images`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  })

  return [data.mainImage, data.bannerImage]
}

export async function updateEventImages(eventId, updates) {
  const formData = new FormData()

  if (updates.mainImage) {
    formData.append("mainImage", updates.mainImage)
  }

  if (updates.bannerImage) {
    formData.append("bannerImage", updates.bannerImage)
  }

  const { data } = await http.patch(`${apiEndpoint}/${eventId}/images`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  })

  return data
}
