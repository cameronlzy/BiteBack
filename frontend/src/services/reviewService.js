import http from './httpService'

const apiEndpoint = import.meta.env.VITE_API_URL + "/reviews"

export async function getReview(reviewId) {
    const { data } = await http.get(apiEndpoint + "/" + reviewId)
    return data
}

export async function getReviewByRestaurant(restaurantId) {
    const { data } = await http.get(apiEndpoint + "/restaurant/" + restaurantId)
    return data
}

export async function getReviewsByCustomer(customerId) {
    const { data } = await http.get(apiEndpoint + "/customer/" + customerId)
    return data
}

export async function saveReview(review, isUpdate) {
    if(isUpdate) {
        const result = {...review}
        delete result._id
        const { data } = await http.patch(apiEndpoint + review._id, result)
        return data
    } else {
        const { data } = await http.post(apiEndpoint, review)
        return data
    }
}

export async function addBadgeVote(reviewId, badgeIndex) {
  const { data } = await http.post(`${apiEndpoint}/${reviewId}/badges`, { badgeIndex })
  return data
}

export async function removeBadgeVote(reviewId) {
  const { data } = await http.delete(`${apiEndpoint}/${reviewId}/badges`)
  return data
}



export async function deleteReview(reviewId) {
    const { data } = await http.delete(apiEndpoint + "/" + reviewId)
    return data
}

export async function postReviewReply(reviewId, replyText) {
  const { data } = await http.post(`${apiEndpoint}/${reviewId}/reply`, { replyText })
  return data
}

export async function deleteReviewReply(reviewId) {
  const { data } = await http.delete(`${apiEndpoint}/${reviewId}/reply`)
  return data
}