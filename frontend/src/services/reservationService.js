import { sanitizeStrings } from "@/utils/stringSanitizer"
import http from "./httpService"
import { toSGT } from "@/utils/timeConverter"

const apiEndpoint = import.meta.env.VITE_API_URL + "/reservations"

function getReservationUrl(id, isRestaurantId) {
    return isRestaurantId ? apiEndpoint + "/restaurant/" + id : `${apiEndpoint}` + "/" + id
}
export async function getReservations() {
  const { data } = await http.get(apiEndpoint)
  return data.map((r) => ({
    ...r,
    reservationDate: toSGT(r.reservationDate).toISO(),
  }))
}

export async function getIndividualReservation(id) {
  const { data } = await http.get(getReservationUrl(id, false))
  return {
    ...data,
    reservationDate: toSGT(data.reservationDate).toISO(),
  }
}

export async function getRestaurantReservations(id, startDate, endDate) {
  let url = `${apiEndpoint}/restaurant/${id}?startDate=${startDate}`
  if (endDate) url += `&endDate=${endDate}`
  const { data } = await http.get(url)
  return data.map((r) => ({
    ...r,
    reservationDate: toSGT(r.reservationDate).toISO(),
  }))
}


export async function saveReservation(reservation, isUpdate) {
  const sanitized = sanitizeStrings(reservation)
    if(isUpdate) {
        const body = {...sanitized}
        delete body._id
        const {data} = await http.patch(getReservationUrl(reservation._id, false), body)
        return data
    } else {
        const {data} = await http.post(apiEndpoint, sanitized)
        return data
    }
}

export async function deleteReservation(id) {
    const {data} = await http.delete(getReservationUrl(id, false))
    return data
}
