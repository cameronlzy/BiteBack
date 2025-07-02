import React, { useEffect, useState } from "react"
import { useForm, FormProvider } from "react-hook-form"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "react-toastify"
import { Input } from "@/components/ui/input"
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"
import SubmitButton from "@/components/common/SubmitButton"
import { safeJoiResolver } from "@/utils/safeJoiResolver"
import { rewardSchema } from "@/utils/schemas"
import {
  saveReward,
  getRewardById,
  updateRewardImage,
} from "@/services/rewardService"
import BackButton from "@/components/common/BackButton"

const RewardForm = ({ user }) => {
  const navigate = useNavigate()
  const [mainImageFile, setMainImageFile] = useState(null)
  const { rewardId } = useParams()
  const defaultRestaurantId = user.profile.restaurants?.[0]?._id || ""

  const form = useForm({
    resolver: safeJoiResolver(rewardSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      restaurant: defaultRestaurantId,
    },
  })

  const { control, handleSubmit, formState } = form

  useEffect(() => {
    if (user.role !== "owner") {
      toast.error("Unauthorized access to reward form")
      navigate("/restaurants", { replace: true })
    }
  }, [user])

  useEffect(() => {
    const fetchReward = async () => {
      if (!rewardId) return
      try {
        const reward = await getRewardById(rewardId)

        const isOwned = user?.profile.restaurants.some(
          (r) => r._id === reward.restaurant._id
        )

        if (!isOwned) {
          toast.error("You are not authorized to edit this reward")
          return navigate(`/rewards/${rewardId}`, { replace: true })
        }

        form.reset({
          name: reward.name,
          description: reward.description,
          price: reward.price,
          restaurant: reward.restaurant._id,
        })

        if (reward.image) setMainImageFile(reward.image)
      } catch {
        toast.error("Failed to fetch reward")
        navigate("/not-found", { replace: true })
      }
    }
    fetchReward()
  }, [rewardId])

  const onSubmit = async (data) => {
    try {
      if (!mainImageFile) {
        toast.error("Image required")
        return
      }

      const isEdit = !!rewardId
      const selectedRestaurant = user.profile.restaurants?.find(
        (r) => r._id === data.restaurant
      )

      if (!selectedRestaurant) {
        toast.error("Invalid restaurant selected")
        return
      }

      const payload = { ...data }
      if (isEdit) {
        payload._id = rewardId
      }

      const cleanedNoEmpty = Object.fromEntries(
        Object.entries(payload).filter(([_k, v]) => v !== "")
      )

      const changes = isEdit
        ? objectComparator(reward, cleanedNoEmpty)
        : cleanedNoEmpty

      if (changes.restaurant === reward?.restaurant?._id) {
        delete changes.restaurant
      }

      if (
        Object.keys(changes).length === 0 &&
        !(mainImageFile instanceof File)
      ) {
        toast.info("No changes made")
        navigate(`/rewards/${rewardId}`, { replace: true })
        return
      }

      if (isEdit) changes._id = rewardId

      const newReward = await saveReward(changes)

      if (mainImageFile instanceof File) {
        await updateRewardImage(newReward._id, { image: mainImageFile })
      }

      toast.success(isEdit ? "Reward updated" : "Reward created")
      navigate("/rewards", { replace: true })
    } catch (ex) {
      if (ex.response?.status === 400) {
        const message = ex.response.data?.error
        form.setError("startDate", {
          type: "manual",
          message: message || "Reward creation failed",
        })
      }
      toast.error("Failed to save reward")
      console.error(ex)
      throw ex
    }
  }

  return (
    <div className="max-w-xl mx-auto mt-10 space-y-6">
      <BackButton from={-1} />
      <FormProvider {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <h2 className="text-2xl font-bold mb-4">
            {rewardId ? "Edit Reward" : "Create New Reward"}
          </h2>

          <FormField
            control={control}
            name="Title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Reward Title" />
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
                  <Input {...field} placeholder="Reward Description" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price (in points)</FormLabel>
                <FormControl>
                  <Input type="number" min={1} {...field} />
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
          <SubmitButton
            type="submit"
            className="w-full"
            condition={formState.isSubmitting}
            normalText={rewardId ? "Update Reward" : "Create Reward"}
            loadingText="Submitting..."
          />
        </form>
      </FormProvider>
    </div>
  )
}

export default RewardForm
