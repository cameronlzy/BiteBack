import { useForm, FormProvider } from "react-hook-form"
import { safeJoiResolver } from "@/utils/safeJoiResolver"
import { reviewSchema } from "@/utils/schemas"
import { DateTime } from "luxon"
import { toast } from "react-toastify"
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import StarRatingInput from "@/components/common/StarRatingInput"
import { useEffect, useState } from "react"
import ImageUpload from "../common/ImageUpload"
import {
  getUnreviewedVisits,
  uploadReviewImages,
} from "@/services/reviewService"
import SubmitButton from "../common/SubmitButton"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import LoadingSpinner from "../common/LoadingSpinner"
import { readableTimeSettings } from "@/utils/timeConverter"

const ReviewForm = ({ restaurant, onSubmit, setReviews, setSortedReviews }) => {
  const [selectedFiles, setSelectedFiles] = useState([])
  const [pastVisits, setPastVisits] = useState(null)

  useEffect(() => {
    const fetchVisits = async () => {
      try {
        const visits = await getUnreviewedVisits(restaurant._id)
        setPastVisits(visits)
      } catch (ex) {
        toast.error("Failed to fetch past visits")
        setPastVisits([])
        console.log(ex)
      }
    }
    fetchVisits()
  }, [restaurant])

  const form = useForm({
    resolver: safeJoiResolver(reviewSchema),
    mode: "onSubmit",
    defaultValues: {
      restaurant: restaurant._id,
      rating: null,
      reviewText: "",
      dateVisited: "",
    },
  })

  const { handleSubmit } = form

  const handleFormSubmit = async (data) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      data.dateVisited = DateTime.fromISO(data.dateVisited)
        .setZone("Asia/Singapore")
        .toISO()
      const res = await onSubmit(data)
      const reviewId = res._id
      let images
      if (selectedFiles.length > 0) {
        images = await uploadReviewImages(reviewId, selectedFiles)
      }
      res.images = images
      if (setReviews && setSortedReviews) {
        setReviews((prev) => [...prev, res])
        setSortedReviews((prev) => [...prev, res])
      }
      toast.success("Review uploaded successfully")
      form.reset()
    } catch (ex) {
      toast.error("Failed to submit review")
      throw ex
    }
  }

  if (pastVisits === null) return <LoadingSpinner />

  if (pastVisits.length === 0) {
    return (
      <div className="border p-4 rounded-md text-center text-muted-foreground">
        <p className="text-lg">No unreviewed past visits</p>
      </div>
    )
  }

  return (
    <FormProvider {...form}>
      <form
        onSubmit={handleSubmit(handleFormSubmit)}
        className="space-y-4 border p-4 rounded-md"
      >
        <h2 className="text-xl font-semibold">Leave a Review</h2>

        <FormField
          control={form.control}
          name="rating"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="flex justify-center">
                  <StarRatingInput
                    value={field.value}
                    onChange={field.onChange}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="reviewText"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Review</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Write your thoughts (optional)..."
                  rows={4}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="dateVisited"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date Visited</FormLabel>
              <Select value={field.value || ""} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a visit date" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {pastVisits.map((date) => {
                    return (
                      <SelectItem key={date} value={date}>
                        {DateTime.fromISO(date).toLocaleString(
                          readableTimeSettings
                        )}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <ImageUpload
          firstRequired={false}
          message="Upload images of your experience (Optional)"
          selectedFiles={selectedFiles}
          setSelectedFiles={setSelectedFiles}
        />
        <SubmitButton
          type="submit"
          className="w-full"
          condition={form.formState.isSubmitting}
          normalText="Submit Review"
          loadingText="Submitting..."
        />
      </form>
    </FormProvider>
  )
}

export default ReviewForm
