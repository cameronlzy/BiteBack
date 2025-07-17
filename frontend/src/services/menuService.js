import http from "./httpService"

const apiEndpoint = import.meta.env.VITE_API_URL + "/menu"

export async function getMenuByRestaurant(restaurantId) {
  const { data } = await http.get(`${apiEndpoint}/restaurant/${restaurantId}`)
  return data
}

export async function getMenuItem(itemId) {
  const { data } = await http.get(`${apiEndpoint}/${itemId}`)
  return data
}

export async function saveMenuItem(item) {
  if (item._id) {
    const payload = { ...item }
    delete payload._id
    const { data } = await http.patch(`${apiEndpoint}/${item._id}`, payload)
    return data
  } else {
    const { data } = await http.post(apiEndpoint, item)
    return data
  }
}

export async function uploadMenuItemImage(itemId, file) {
  const formData = new FormData()
  formData.append("image", file)

  const { data } = await http.post(`${apiEndpoint}/${itemId}/image`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  })

  return data.image
}

export async function updateMenuItemImage(itemId, file) {
  const formData = new FormData()
  formData.append("image", file)

  const { data } = await http.patch(`${apiEndpoint}/${itemId}/image`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  })

  return data.image
}

export async function updateMenuItem(itemId, payload) {
  const { data } = await http.patch(`${apiEndpoint}/${itemId}`, payload)
  return data
}

export async function deleteMenuItem(itemId) {
  const { data } = await http.delete(`${apiEndpoint}/${itemId}`)
  return data
}

export async function toggleInStock(itemId, payload) {
  const { data } = await http.patch(`${apiEndpoint}/${itemId}/in-stock`, payload)
  return data
}