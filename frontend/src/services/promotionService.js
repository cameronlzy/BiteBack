import { DateTime } from "luxon"
import http from "./httpService"
import { dateConverter } from "@/utils/timeConverter"

const apiEndpoint = import.meta.env.VITE_API_URL + "/promotions"
const timeConverter = (p) => {
  if (p.timeWindow?.startTime && p.timeWindow?.endTime) {
      const convert = (timeStr) =>
        DateTime.fromFormat(timeStr, "HH:mm", { zone: "utc" })
          .setZone("Asia/Singapore")
          .toFormat("HH:mm")

      p.timeWindow.startTime = convert(p.timeWindow.startTime)
      p.timeWindow.endTime = convert(p.timeWindow.endTime)
    }
    return p
}

const convertPromotion = (promotion) => {
  return dateConverter(timeConverter(promotion))
}

export async function savePromotion(promotion) {
  if (promotion._id) {
    const payload = {...promotion}
    delete payload._id
    const { data } = await http.patch(`${apiEndpoint}/${promotion._id}`, payload)
    return data
  } else {
    const { data } = await http.post(apiEndpoint, promotion)
    return data
  }
}

export async function uploadPromotionImages(promotionId, files) {
  if (!promotionId) throw new Error("Promotion ID is required")
  if (!files || files.length !== 2) throw new Error("Both images are required")

  const [mainImage, bannerImage] = files
  const images = { mainImage, bannerImage }

  for (const key in images) {
    const file = images[key]
    if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
      throw new Error(`${key} must be JPEG or PNG`)
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new Error(`${key} exceeds 5MB`)
    }
  }

  const formData = new FormData()
  formData.append("mainImage", mainImage)
  formData.append("bannerImage", bannerImage)

  const { data } = await http.post(`${apiEndpoint}/${promotionId}/images`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  })

  return [data.mainImage, data.bannerImage]
}

export async function updatePromotionImage(promotionId, updates) {
  const formData = new FormData()

  if (updates.mainImage) {
    if (updates.mainImage.size > 5 * 1024 * 1024) {
      throw new Error("Main image exceeds 5MB")
    }
    formData.append("mainImage", updates.mainImage)
  }

  if (updates.bannerImage) {
    if (updates.bannerImage.size > 5 * 1024 * 1024) {
      throw new Error("Banner image exceeds 5MB")
    }
    formData.append("bannerImage", updates.bannerImage)
  }

  const { data } = await http.patch(`${apiEndpoint}/${promotionId}/images`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  })

  return data
}

export async function getPromotions(params = {}) {
  const { data } = await http.get(apiEndpoint, { params })
  const promotions = data.promotions.map(convertPromotion)
  return { ...data, promotions }
}

export async function getPromotionById(id) {
  const { data } = await http.get(`${apiEndpoint}/${id}`)
  return convertPromotion(data)
}

export async function getOwnerPromotions(params) {
  console.log(params)
  const { data } = await http.get(`${apiEndpoint}/owner`, { params })
  const promotions = data?.promotions?.map(convertPromotion)
  return {...data, promotions}
}

export async function deletePromotion(id) {
  const { data } = await http.delete(`${apiEndpoint}/${id}`)
  return data
}