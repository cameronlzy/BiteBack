import { completeRedemption } from "@/services/rewardService"
import { rewardClaimSchema } from "@/utils/schemas"
import { safeJoiResolver } from "@/utils/safeJoiResolver"
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

const StaffRewardCompletion = () => {
  const form = useForm({
    resolver: safeJoiResolver(rewardClaimSchema),
    defaultValues: {
      code: "",
    },
    mode: "onChange",
  })

  const onSubmit = async (data) => {
    try {
      await completeRedemption(data)
      toast.success("Successfully claimed redemption")
      form.reset()
    } catch (ex) {
      if (ex.response?.status === 400 || ex.response?.status === 404) {
        const message = ex.response.data.error
        form.setError("code", {
          type: "manual",
          message: message || "Claim failed",
        })
        toast.error("Claim failed: " + message)
      }
    }
  }
  return (
    <div className="border rounded-xl p-5 my-6 shadow-sm space-y-4 mx-5.5">
      <h1 className="text-2xl font-bold">Customer Reward Completion</h1>
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reward Code</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="tel"
                    inputMode="numeric"
                    pattern="\d*"
                    placeholder="Ask Customer for their Reward Code"
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
            normalText="Redeem Reward"
            loadingText="Redeeming..."
          />
        </form>
      </FormProvider>
    </div>
  )
}

export default StaffRewardCompletion
