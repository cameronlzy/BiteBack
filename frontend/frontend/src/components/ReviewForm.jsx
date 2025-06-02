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
import { Button } from "@/components/ui/button"
import StarRatingInput from "@/components/common/StarRatingInput"
import { Input } from "./ui/input"

const ReviewForm = ({ restaurant, onSubmit }) => {
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

  const {
    setValue,
    handleSubmit,
    watch,
    formState: { errors },
  } = form

  const dateVisitedRaw = watch("dateVisited")
  const dateVisited = dateVisitedRaw ? new Date(dateVisitedRaw) : undefined

  const handleFormSubmit = async (data) => {
    try {
      await onSubmit(data)
      form.reset()
    } catch (ex) {
      toast.error("Failed to submit review")
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

        <Button type="submit" className="w-full">
          Submit Review
        </Button>
      </form>
    </FormProvider>
  )
}

export default ReviewForm
