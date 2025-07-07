import { safeJoiResolver } from "@/utils/safeJoiResolver"
import { pointUpdateSchema } from "@/utils/schemas"
import { FormProvider, useForm } from "react-hook-form"
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import SubmitButton from "@/components/common/SubmitButton"
import { toast } from "react-toastify"
import { updateCustomerPoints } from "@/services/rewardService"

const StaffPointUpdate = () => {
  const restaurantId = localStorage.getItem("restaurant")

  const form = useForm({
    resolver: safeJoiResolver(pointUpdateSchema),
    defaultValues: {
      username: "",
      change: "",
    },
    mode: "onChange",
  })

  const onSubmit = async (data) => {
    try {
      await updateCustomerPoints(restaurantId, data)
      toast.success("Successfully updated customer points")
      form.reset()
    } catch (ex) {
      if (ex.response?.status === 400 || ex.response?.status === 404) {
        const message = ex.response.data.error
        form.setError("username", {
          type: "manual",
          message: message || "Submission failed",
        })
        toast.error("Submission failed: " + message)
      }
    }
  }
  return (
    <div className="border rounded-xl p-5 my-6 shadow-sm space-y-4 mx-5.5">
      <h1 className="text-2xl font-bold">Customer Point Update</h1>
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer Username</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Ask Customer for their Username"
                    type="text"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="change"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Points</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="New Points"
                    type="number"
                    min={0}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <SubmitButton
            type="submit"
            className="w-full"
            condition={form.formState.isSubmitting}
            normalText="Update Points"
            loadingText="Updating..."
          />
        </form>
      </FormProvider>
    </div>
  )
}

export default StaffPointUpdate
