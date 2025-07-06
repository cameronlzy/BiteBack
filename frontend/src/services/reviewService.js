import { sanitizeStrings } from '@/utils/stringSanitizer'
import http from './httpService'
import { toSGTISO } from '@/utils/timeConverter'

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

export async function getUnreviewedVisits(restaurantId) {
  const { data } = await http.get(apiEndpoint+ "/eligible-visits", {
    params: { restaurantId },
  })
  const converted = data.map((d) => toSGTISO(d.visitDate))
  return converted
}

export async function saveReview(review) {
    const { data } = await http.post(apiEndpoint, sanitizeStrings(review))
    return data
}

export async function uploadReviewImages(reviewId, files) {
  if (!reviewId) throw new Error("Review ID is required")
  if (!files || files.length === 0) return []

  const limitedFiles = files.slice(0, 5)

  for (const file of limitedFiles) {
    if (file.size > 5 * 1024 * 1024) {
      throw new Error(`File "${file.name}" exceeds 5MB limit.`)
    }
    if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
      throw new Error(`Unsupported format for "${file.name}".`)
    }
  }

  const formData = new FormData()
  limitedFiles.forEach((file) => formData.append("images", file))

  const { data: imageUrls } = await http.post(
    `${apiEndpoint}/${reviewId}/images`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  )

  return imageUrls
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
  const { data } = await http.post(`${apiEndpoint}/${reviewId}/reply`, {
    replyText: replyText.trim(),
  })
  return data
}

export async function deleteReviewReply(reviewId) {
  const { data } = await http.delete(`${apiEndpoint}/${reviewId}/reply`)
  return data
}