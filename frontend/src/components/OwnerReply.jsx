import { useForm, FormProvider } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"
import { postReviewReply, deleteReviewReply } from "@/services/reviewService"
import { toast } from "react-toastify"
import { Trash2 } from "lucide-react"

const OwnerReply = ({ review, user, restaurant, onReplyChange }) => {
  const isOwnedByUser = user?.role === "owner" && user._id === restaurant?.owner

  const methods = useForm({
    defaultValues: {
      replyText: review.reply ?? "",
    },
  })

  const {
    handleSubmit,
    control,
    reset,
    formState: { isSubmitting },
  } = methods

  const onSubmit = async ({ replyText }) => {
    try {
      const updatedReview = await postReviewReply(review._id, replyText)
      onReplyChange(updatedReview.reply)
      toast.success("Reply posted!")
    } catch (err) {
      toast.error("Failed to post reply")
      console.error(err)
    }
  }

  const onDelete = async () => {
    try {
      await deleteReviewReply(review._id)
      onReplyChange(null)
      reset({ replyText: "" })
      toast.success("Reply deleted")
    } catch (err) {
      toast.error("Failed to delete reply")
      console.error(err)
    }
  }

  return (
    <div className="mt-4">
      {review.reply && (
        <div className="bg-gray-100 p-3 rounded">
          <b className="text-gray-700">Owner Reply:</b>
          <p className="mt-1 text-gray-800">{review.reply}</p>
        </div>
      )}

      {isOwnedByUser && (
        <FormProvider {...methods}>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-3 mt-3 border-t pt-4"
          >
            <FormField
              control={control}
              name="replyText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {review.reply ? "Edit Reply" : "Add Reply"}
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Enter reply..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting}>
                {review.reply ? "Update" : "Submit"}
              </Button>
              {review.reply && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={onDelete}
                  disabled={isSubmitting}
                >
                  <Trash2 />
                </Button>
              )}
            </div>
          </form>
        </FormProvider>
      )}
    </div>
  )
}

export default OwnerReply
