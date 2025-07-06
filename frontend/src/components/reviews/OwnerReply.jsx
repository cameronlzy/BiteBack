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
import SubmitButton from "../common/SubmitButton"
import { ownedByUser } from "@/utils/ownerCheck"

const OwnerReply = ({ review, user, restaurant, onReplyChange }) => {
  const isOwnedByUser = ownedByUser(restaurant, user)

  const form = useForm({
    defaultValues: {
      replyText: review.reply?.replyText ?? "",
    },
  })

  const {
    handleSubmit,
    control,
    reset,
    formState: { isSubmitting },
  } = form

  const onSubmit = async ({ replyText }) => {
    try {
      const updatedReview = await postReviewReply(review._id, replyText)
      onReplyChange(updatedReview.reply)
      toast.success("Reply posted!")
    } catch (ex) {
      toast.error("Failed to post reply")
      throw ex
    }
  }

  const onDelete = async () => {
    try {
      await deleteReviewReply(review._id)
      onReplyChange(null)
      reset({ replyText: "" })
      toast.success("Reply deleted")
    } catch (ex) {
      toast.error("Failed to delete reply")
      throw ex
    }
  }

  return (
    <div className="mt-4">
      {review.reply && (
        <div className="bg-gray-100 p-4 rounded">
          <b className="text-gray-700 block mb-1 text-center">Owner Reply:</b>

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <p className="text-gray-800">{review.reply.replyText}</p>

            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 text-xs text-gray-500">
              <span>
                {DateTime.fromISO(review.reply.createdAt).toLocaleString({
                  ...readableTimeSettings,
                  hour: undefined,
                  minute: undefined,
                })}
              </span>

              {review.reply.owner === user?._id && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={onDelete}
                  disabled={isSubmitting}
                  size="sm"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
      {isOwnedByUser && (
        <FormProvider {...form}>
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
                <SubmitButton
                  type="submit"
                  condition={isSubmitting}
                  normalText="Submit"
                  loadingText="Submitting..."
                />
              )}
            </div>
          </form>
        </FormProvider>
      )}
    </div>
  )
}

export default OwnerReply
