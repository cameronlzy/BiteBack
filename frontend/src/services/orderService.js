import http from "./httpService"

const apiEndpoint = import.meta.env.VITE_API_URL + "/orders"

export async function saveOrder(order) {
  if (order._id) {
    const payload = { ...order }
    delete payload._id
    const { data } = await http.patch(`${apiEndpoint}/${order._id}`, payload)
    return data
  } else {
    const { data } = await http.post(apiEndpoint, order)
    return data
  }
}

export async function getCustomerPastOrders(params) {
  const { data } = await http.get(apiEndpoint, { params })
  return data
}

export async function getOrderById(orderId) {
  const { data } = await http.get(`${apiEndpoint}/${orderId}`)
  return data
}

export async function getOrderByCode(code) {
  const { data } = await http.get(`${apiEndpoint}/code/${code}`)
  return data
}

export async function getOrderByCustomerId(customerId) {
  const { data } = await http.get(`${apiEndpoint}/customer/${customerId}`)
  return data
}

export async function getOrdersByRestaurant(restaurantId, params) {
  const { data } = await http.get(`${apiEndpoint}/restaurant/${restaurantId}`, {
    params,
  })
  return data
}

export async function assignTable(orderId, tableNumber) {
  const { data } = await http.patch(`${apiEndpoint}/${orderId}/table`, {
    tableNumber,
  })
  return data
}

export async function updateOrderStatus(orderId, status) {
  const { data } = await http.patch(`${apiEndpoint}/${orderId}/status`, {
    status,
  })
  return data
}