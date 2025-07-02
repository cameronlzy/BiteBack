import http from "./httpService"

const apiEndpoint = import.meta.env.VITE_API_URL + "/rewards"

// Points
export async function getCustomerPointsAll() {
  const { data } = await http.get(`${apiEndpoint}/points`)
  return data
}

export async function getCustomerPointsForRestaurant(restaurantId) {
  const { data } = await http.get(`${apiEndpoint}/restaurant/${restaurantId}/points`)
  return data
}

export async function updateCustomerPoints(restaurantId, points) {
  const { data } = await http.post(`${apiEndpoint}/restaurant/${restaurantId}/points`, points)
  return data
}

// Redemptions
export async function getRedemptionHistory() {
  const { data } = await http.get(`${apiEndpoint}/redemptions`)
  return data
}

export async function getRedemptionById(id) {
  const { data } = await http.get(`${apiEndpoint}/redemptions/${id}`)
  return data
}

export async function redeemRewardItem(customerDetails) {
  const { data } = await http.post(`${apiEndpoint}/redemptions`, customerDetails)
  return data
}

// Shop
export async function getRewardsForRestaurant(restaurantId, params = {}) {
  const { data } = await http.get(`${apiEndpoint}/restaurant/${restaurantId}/shop`, { params })
  return data
}

export async function getRewardById(itemId) {
  const { data } = await http.get(`${apiEndpoint}/shop/${itemId}`)
  return data
}

export async function saveReward(restaurantId, reward) {
  if (reward._id) {
    const payload = { ...reward }
    delete payload._id
    const { data } = await http.patch(
      `${apiEndpoint}/restaurant/${restaurantId}/shop/${reward._id}`,
      payload
    )
    return data
  } else {
    const { data } = await http.post(
      `${apiEndpoint}/restaurant/${restaurantId}/shop`,
      reward
    )
    return data
  }
}

export async function deleteReward(restaurantId, itemId) {
  const { data } = await http.delete(`${apiEndpoint}/restaurant/${restaurantId}/shop/${itemId}`)
  return data
}