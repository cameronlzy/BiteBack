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

export async function saveReview(review) {
    const { data } = await http.post(apiEndpoint, review)
    return data
}

export async function deleteReview(reviewId) {
    const { data } = await http.delete(apiEndpoint + "/" + reviewId)
    return data
}
