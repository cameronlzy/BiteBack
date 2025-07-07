import React, { useEffect, useState } from "react"
import { useForm, FormProvider } from "react-hook-form"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "react-toastify"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
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
import { saveReward, getRewardById } from "@/services/rewardService"
import BackButton from "@/components/common/BackButton"
import { categoryOptions } from "@/utils/rewardUtils"
import { objectComparator } from "@/utils/objectComparator"
import { ownedByUser } from "@/utils/ownerCheck"
import { getRestaurant } from "@/services/restaurantService"
import LoadingSpinner from "../common/LoadingSpinner"

const RewardForm = ({ user }) => {
  const navigate = useNavigate()
  const { rewardId, restaurantId } = useParams()
  const [existingReward, setExistingReward] = useState(null)
  const [loading, setLoading] = useState(false)

  const form = useForm({
    resolver: safeJoiResolver(rewardSchema),
    defaultValues: {
      category: "",
      description: "",
      pointsRequired: "",
      stock: "",
    },
  })

  const { control, handleSubmit, formState, setError, reset } = form

  useEffect(() => {
    const userCheckForOwnership = async () => {
      try {
        if (user.role !== "owner") {
          toast.error("Unauthorized")
          return navigate("/restaurants", { replace: true })
        }
        const restaurant = await getRestaurant(restaurantId)
        const isOwned = ownedByUser(restaurant, user)
        if (!isOwned) {
          toast.error("Not your restaurant", { toastId: "notRestaurant" })
          return navigate("/restaurants", { replace: true })
        }
      } catch (ex) {
        if (ex?.response?.status == 404) {
          toast.error("Restaurant Not Found")
          navigate("/not-found", { replace: true })
        }
      }
    }
    userCheckForOwnership()
  }, [user, restaurantId])

  useEffect(() => {
    const fetchReward = async () => {
      if (!rewardId) return

      setLoading(true)

      try {
        const reward = await getRewardById(rewardId)
        if (reward.restaurant !== restaurantId) {
          toast.error("Reward not in restaurant", {
            toastId: "rewardNotInRestaurant",
          })
          return navigate("/not-found", { replace: true })
        }

        setExistingReward(reward)

        reset({
          category: reward.category,
          description: reward.description,
          pointsRequired: reward.pointsRequired,
          stock: reward.stock || "",
        })
      } catch {
        toast.error("Failed to fetch reward")
        navigate("/not-found", { replace: true })
      } finally {
        setLoading(false)
      }
    }

    fetchReward()
  }, [rewardId, restaurantId])

  const onSubmit = async (data) => {
    try {
      let payload = { ...data }

      if (payload.stock === "") {
        delete payload.stock
      }

      if (rewardId) {
        payload = objectComparator(existingReward, payload)
        if (Object.keys(payload).length === 0) {
          toast.info("No Change to Reward")
          navigate(`/current-rewards/${restaurantId}`, { replace: true })
          return
        }
        payload._id = rewardId
      }

      await saveReward(restaurantId, payload)
      toast.success(rewardId ? "Reward updated" : "Reward created")
      navigate(`/current-rewards/${restaurantId}`, { replace: true })
    } catch (ex) {
      if (ex.response?.status === 400) {
        setError("description", {
          type: "manual",
          message: ex.response.data?.error || "Error saving reward",
        })
      }
      toast.error("Failed to save reward")
    }
  }

  if (loading) return <LoadingSpinner />

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
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reward Type</FormLabel>
                {rewardId ? (
                  <FormControl>
                    <Input
                      {...field}
                      readOnly
                      disabled
                      value={
                        categoryOptions.find((opt) => opt.value === field.value)
                          ?.label || field.value
                      }
                    />
                  </FormControl>
                ) : (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categoryOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
          {rewardId && (
            <p className="text-muted-foreground text-sm mb-0">
              Category for Reward not allowed to be edited
            </p>
          )}
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
            name="pointsRequired"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Points Required</FormLabel>
                <FormControl>
                  <Input type="number" min={1} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="stock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stock (optional)</FormLabel>
                <FormControl>
                  <Input type="number" min={0} {...field} />
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
