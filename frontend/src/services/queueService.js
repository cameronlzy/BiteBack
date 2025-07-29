import { toast } from "react-toastify"
import http from "./httpService"

const apiEndpoint = import.meta.env.VITE_API_URL + "/queue"

export async function getCurrentCustomerQueue(queueId) {
  const { data } = await http.get(`${apiEndpoint}/${queueId}`)
  return data
  // return {
  //     _id: queueId,
  //     queueNumber: 2011,
  //     status: "confirming",
  //     pax: 4,
  // }
}

export async function getCurrentRestaurantQueue(restaurantId) {
  const { data } = await http.get(`${apiEndpoint}/restaurant/${restaurantId}`)
  return data
  // return [{
  //     currentQueueNumber: 7,
  //     latestQueueNumber: 11
  // }, {
  //     currentQueueNumber: 7,
  //     latestQueueNumber: 22
  // }, {
  //     currentQueueNumber: 2,
  //     latestQueueNumber: 7
  // }]
}

export async function joinQueue(queueDetails) {
  const { data } = await http.post(apiEndpoint, queueDetails)
  return data
}

export async function leaveQueue(restaurantId) {
  const { data } = await http.delete(`${apiEndpoint}/${restaurantId}`)
  return data
}

export async function toggleQueueEnabled(restaurantId, enabled) {
  const { data } = await http.patch(
    `${apiEndpoint}/restaurant/${restaurantId}/queue`,
    {
      enabled,
    }
  )
  return data
}

export const createQueueEventSource = (queueId, onStatusUpdate) => {
  const eventSource = new EventSource(`${apiEndpoint}/stream`, {
    withCredentials: true,
  })

  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data)

    if (data.queueEntry === queueId) {
      onStatusUpdate(event)

      if (data.status === "called") {
        toast.success("Your turn has come! Please proceed to the counter.", {
          autoClose: false,
          closeOnClick: false,
        })
      }
    }
  }

  eventSource.onerror = (error) => {
    console.error("EventSource error:", error)
    eventSource.close()
  }

  return eventSource
}

export const closeEventSource = (eventSource) => {
  if (eventSource) {
    eventSource.close()
  }
}
