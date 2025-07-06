import React, { useEffect, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { useForm, FormProvider } from "react-hook-form"
import { toast } from "react-toastify"
import { Input } from "@/components/ui/input"
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"

import ImageUpload from "@/components/common/ImageUpload"
import SubmitButton from "@/components/common/SubmitButton"
import { safeJoiResolver } from "@/utils/safeJoiResolver"
import { promotionSchema } from "@/utils/schemas"
import {
  savePromotion,
  getPromotionById,
  updatePromotionImage,
} from "@/services/promotionService"
import {
  Select,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "../ui/select"
import { objectComparator } from "@/utils/objectComparator"
import { DateTime } from "luxon"
import BackButton from "../common/BackButton"
import { toSGTISO } from "@/utils/timeConverter"
import { ownedByUser } from "@/utils/ownerCheck"

const PromotionForm = ({ user }) => {
  const navigate = useNavigate()
  const [mainImageFile, setMainImageFile] = useState(null)
  const [bannerImageFile, setBannerImageFile] = useState(null)
  const [promotion, setPromotion] = useState(null)
  const { promotionId } = useParams()
  const location = useLocation()
  const from = location.state?.from || "/promotions"

  useEffect(() => {
    if (user.role !== "owner") {
      toast.error("Unauthorized access to promotion form")
      navigate("/restaurants", { replace: true })
    }
  }, [user._id])

  useEffect(() => {
    const fetchPromotion = async () => {
      if (!promotionId) return
      try {
        const promotion = await getPromotionById(promotionId)
        setPromotion(promotion)
        const isOwned = ownedByUser(promotion?.restaurant, user)

        if (!isOwned) {
          toast.error("You are not authorized to edit this promotion")
          return navigate(`/promotions/${promotionId}`, { replace: true })
        }

        form.reset({
          title: promotion.title || "",
          description: promotion.description || "",
          startDate: promotion.startDate?.slice(0, 16),
          endDate: promotion.endDate?.slice(0, 16),
          timeWindow: {
            startTime: promotion.timeWindow?.startTime || "",
            endTime: promotion.timeWindow?.endTime || "",
          },
          restaurant: promotion.restaurant._id,
        })
        if (promotion.mainImage) {
          setMainImageFile(promotion.mainImage)
        }
        if (promotion.bannerImage) {
          setBannerImageFile(promotion.bannerImage)
        }
      } catch {
        toast.error("Failed to fetch promotion")
        navigate("/not-found", { replace: true })
      }
    }

    fetchPromotion()
  }, [promotionId])

  const defaultRestaurantId = user.profile.restaurants?.[0]?._id || ""

  const form = useForm({
    resolver: safeJoiResolver(promotionSchema),
    defaultValues: {
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      timeWindow: {
        startTime: "",
        endTime: "",
      },
      restaurant: defaultRestaurantId,
    },
    mode: "onSubmit",
  })

  const { control, handleSubmit, formState, setError } = form
  const localMin = DateTime.local().toFormat("yyyy-LL-dd'T'HH:mm")

  useEffect(() => {
    return () => {
      if (mainImageFile) URL.revokeObjectURL(mainImageFile)
      if (bannerImageFile) URL.revokeObjectURL(bannerImageFile)
    }
  }, [mainImageFile, bannerImageFile])

  const onSubmit = async (data) => {
    try {
      if (!mainImageFile || !bannerImageFile) {
        toast.error("Both Main and Banner images are required")
        return
      }

      const isEdit = !!promotionId
      const selectedRestaurant = user.profile.restaurants?.find(
        (r) => r._id === data.restaurant
      )

      if (!selectedRestaurant) {
        toast.error("Invalid restaurant selected")
        return
      }

      const payload = {
        ...data,
      }

      const { startTime, endTime } = data.timeWindow || {}

      const hasStart = !!startTime?.trim()
      const hasEnd = !!endTime?.trim()

      if (hasStart && !hasEnd) {
        setError("timeWindow.endTime", {
          type: "manual",
          message: "End time is required if start time is set.",
        })
        return
      } else if (!hasStart && hasEnd) {
        setError("timeWindow.startTime", {
          type: "manual",
          message: "Start time is required if end time is set.",
        })
        return
      }

      if (!hasStart && !hasEnd) {
        delete payload.timeWindow
      }
      if (isEdit) {
        payload._id = promotionId
      }

      if (data.startDate) payload.startDate = toSGTISO(data.startDate)
      if (data.endDate) payload.endDate = toSGTISO(data.endDate)
      const cleanedNoEmpty = Object.fromEntries(
        Object.entries({ ...payload }).filter(([_ignore, v]) => v !== "")
      )
      let changes = promotionId
        ? objectComparator(promotion, cleanedNoEmpty)
        : cleanedNoEmpty
      if (changes.restaurant === promotion?.restaurant?._id) {
        delete changes.restaurant
      }
      if (
        Object.keys(changes).length === 0 &&
        !(mainImageFile instanceof File) &&
        !(bannerImageFile instanceof File)
      ) {
        toast.info("No changes made")
        navigate(`/promotions/${promotionId}`, { replace: true })
        return
      }
      promotionId ? (changes._id = promotionId) : delete changes._id
      const newPromotion = await savePromotion(changes)

      const changedImages = {}
      if (mainImageFile instanceof File) {
        changedImages.mainImage = mainImageFile
      }
      if (bannerImageFile instanceof File) {
        changedImages.bannerImage = bannerImageFile
      }

      if (Object.keys(changedImages).length > 0) {
        await updatePromotionImage(newPromotion._id, changedImages)
      }

      toast.success(isEdit ? "Promotion updated" : "Promotion created")
      navigate(`/promotions`, { replace: true })
    } catch (ex) {
      if (ex.response?.status === 400) {
        const message = ex.response.data?.error
        form.setError("startDate", {
          type: "manual",
          message: message || "Reservation failed",
        })
      }
      toast.error("Failed to save promotion")
      console.error(ex)
      throw ex
    }
  }

  return (
    <div className="space-y-6 max-w-xl mx-auto mt-10">
      <BackButton from={from} />
      <FormProvider {...form}>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6 max-w-xl mx-auto mt-10"
        >
          <h2 className="text-2xl font-bold mb-4">
            {promotionId ? "Edit Promotion Details" : "Create New Promotion"}
          </h2>

          <FormField
            control={control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Promotion Title" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Promotion Description" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date & Time</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} min={localMin} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Date & Time</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} min={localMin} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="timeWindow.startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Daily Start Time (HH:mm) - Optional</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <p className="text-sm text-muted-foreground">
                  Leave both blank to allow promotion to last 24/7.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="timeWindow.endTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Daily End Time (HH:mm) - Optional</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="restaurant"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Restaurant</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a restaurant" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {user.profile.restaurants?.map((r) => (
                      <SelectItem key={r._id} value={r._id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <ImageUpload
            index={0}
            selectedFiles={mainImageFile ? [mainImageFile] : []}
            setSelectedFiles={(files) => setMainImageFile(files[0] || null)}
            message="Upload Main Image (1 only)"
            title="Main Image"
            firstRequired={true}
            maxFiles={1}
          />

          <ImageUpload
            index={1}
            selectedFiles={bannerImageFile ? [bannerImageFile] : []}
            setSelectedFiles={(files) => setBannerImageFile(files[0] || null)}
            message="Upload Banner Image (1 only)"
            title="Banner Image"
            firstRequired={true}
            maxFiles={1}
          />

          <SubmitButton
            type="submit"
            className="w-full"
            condition={formState.isSubmitting}
            normalText={promotionId ? "Update Promotion" : "Create Promotion"}
            loadingText="Creating..."
          />
        </form>
      </FormProvider>
    </div>
  )
}

export default PromotionForm
