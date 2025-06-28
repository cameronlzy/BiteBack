import http from "./httpService"
import { toSGT } from "@/utils/timeConverter"

const apiEndpoint = import.meta.env.VITE_API_URL + "/analytics/restaurant"

export async function getTodaySnapshot(restaurantId) {
  const { data } = await http.get(`${apiEndpoint}/${restaurantId}/snapshot`)
  return data 
}

export async function getSummary(restaurantId, { date, amount, unit } = {}) {
  const params = new URLSearchParams()
  if (date) params.append("date", date)
  if (amount) params.append("amount", amount)
  if (unit) params.append("unit", unit)
  const { data } = await http.get(`${apiEndpoint}/${restaurantId}/summary?${params.toString()}`)

  if (data.type === "single") {
    data.aggregated.date = toSGT(data.aggregated.date).toISO()
  } else if (data.type === "range") {
    for (const entry of data.entries) {
      entry.startDate = toSGT(entry.startDate).toISO()
      entry.endDate = toSGT(entry.endDate).toISO()
    }
  }

  return data
}

export async function getTrends(restaurantId, days) {
  const { data } = await http.get(`${apiEndpoint}/${restaurantId}/trends?days=${days}`)
  const filteredData = {...data}
  filteredData.entries = (data.entries || []).slice(-days)
  return filteredData
}