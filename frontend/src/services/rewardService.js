import http from "./httpService"

const apiEndpoint = import.meta.env.VITE_API_URL + "/rewards"

// Points Routes
export async function getCustomerPointsAll() {
  const { data } = await http.get(`${apiEndpoint}/points`)
  return data
}

export async function getCustomerPointsForRestaurant(restaurantId) {
  const { data } = await http.get(`${apiEndpoint}/restaurant/${restaurantId}/points`)
  return data
}

export async function updateCustomerPoints(restaurantId, newPoints) {
  const { data } = await http.patch(`${apiEndpoint}/restaurant/${restaurantId}/points`, newPoints)
  return data
}

// Redemptions Routes
export async function getRedemptionHistory(params = {page: 1, limit: 8}) {
  const { data } = await http.get(`${apiEndpoint}/redemptions`, { params })
  return data
}

export async function getRedemptionById(id) {
  const { data } = await http.get(`${apiEndpoint}/redemptions/${id}`)
  return data
}

export async function redeemRewardItem(payload) {
  const { data } = await http.post(`${apiEndpoint}/redemptions`, payload)
  return data
}

export async function activateRedemption(id) {
    const { data } = await http.patch(`${apiEndpoint}/redemptions/${id}`)
    return data
}

export async function completeRedemption(payload) {
    const { data } = await http.patch(`${apiEndpoint}/redemptions/complete`, payload)
    return data
}

// Shop Routes
export async function getRewardsForRestaurant(restaurantId, params = {page: 1, limit: 8}) {
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