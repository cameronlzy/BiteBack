import { useForm, FormProvider } from "react-hook-form"
import { safeJoiResolver } from "@/utils/safeJoiResolver"
import { reviewSchema } from "@/utils/schemas"
import { format } from "date-fns"
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
import { Input } from "./ui/input"
import { useState } from "react"
import ImageUpload from "./common/ImageUpload"
import { uploadReviewImages } from "@/services/reviewService"
import SubmitButton from "./common/SubmitButton"

const ReviewForm = ({ restaurant, onSubmit, setReviews, setSortedReviews }) => {
  const [selectedFiles, setSelectedFiles] = useState([])
  const form = useForm({
    resolver: safeJoiResolver(reviewSchema),
    mode: "onSubmit",
    defaultValues: {
      restaurant: restaurant._id,
      rating: undefined,
      reviewText: "",
      dateVisited: undefined,
    },
  })

  const { handleSubmit } = form

  const handleFormSubmit = async (data) => {
    try {
      await ((ms) => new Promise((resolve) => setTimeout(resolve, ms)))(1000)
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
                <div>
                  <Textarea
                    {...field}
                    placeholder="Write your thoughts (optional)..."
                    rows={4}
                  />
                </div>
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
              <FormControl>
                <Input
                  type="date"
                  className="w-full"
                  max={format(new Date(), "yyyy-MM-dd")}
                  value={field.value || ""}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <ImageUpload
          firstRequired={false}
          message="Upload images of your experience (Optional) "
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
