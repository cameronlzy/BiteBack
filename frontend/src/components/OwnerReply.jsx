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
import { DateTime } from "luxon"
import { readableTimeSettings } from "@/utils/timeConverter"

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
    }
  }

  return (
    <div className="mt-4">
      {review.reply && (
        <div className="relative bg-gray-100 p-4 rounded text-center h-20">
          <b className="text-gray-700 block mb-1">Owner Reply:</b>
          <p className="text-gray-800">{review.reply.replyText}</p>

          {review.reply.owner === user?._id && (
            <Button
              type="button"
              variant="destructive"
              onClick={onDelete}
              disabled={isSubmitting}
              className="absolute top-2 right-2"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
          <p className="absolute bottom-2 right-2 text-xs text-gray-500">
            {DateTime.fromISO(review.reply.createdAt).toLocaleString({
              ...readableTimeSettings,
              hour: undefined,
              minute: undefined,
            })}
          </p>
        </div>
      )}

      {isOwnedByUser && (
        <FormProvider {...methods}>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-3 mt-3 border-t pt-4"
          >
            {!review.reply && (
              <FormField
                control={control}
                name="replyText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Add Reply</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter reply..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <div className="flex gap-2">
              {!review.reply && (
                <Button type="submit" disabled={isSubmitting}>
                  Submit
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
