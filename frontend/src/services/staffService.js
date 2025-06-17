import http from './httpService'

const apiEndpoint = import.meta.env.VITE_API_URL

export async function staffLogin(loginDetails) {
    const { data } = await http.post(`${apiEndpoint}/auth/login/staff`, loginDetails)
    return data
}

export async function getRestaurantQueueOverview(restaurantId) {
  const { data } = await http.get(`${apiEndpoint}/queue/restaurant/${restaurantId}/overview`)
  return data
}

export async function updateQueueEntryStatus(queueEntryId, status) {
  const { data } = await http.patch(`${apiEndpoint}/queue/${queueEntryId}/status`, { status })
  return data
}

export async function callNextCustomer(restaurantId, queueGroup) {
  const { data } = await http.patch(
    `${apiEndpoint}/queue/restaurant/${restaurantId}/next?queueGroup=${queueGroup}`
  )
  return data
}

export async function toggleQueueEnabled(restaurantId, enabled) {
  const { data } = await http.patch(`${apiEndpoint}/restaurant/${restaurantId}/queue`, {
    enabled,
  })
  return data 
}