import { FormProvider, useForm } from "react-hook-form"
import { identifierSchema } from "../utils/schemas"
import auth from "../services/authService"
import { toast } from "react-toastify"
import { useNavigate } from "react-router-dom"
import { Button } from "./ui/button"
import { safeJoiResolver } from "@/utils/safeJoiResolver"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form"
import { Input } from "./ui/input"
import SubmitButton from "./common/SubmitButton"

const ForgotPassword = () => {
  const navigate = useNavigate()
  const form = useForm({
    resolver: safeJoiResolver(identifierSchema),
    defaultValues: {
      identifier: "",
    },
    mode: "onChange",
  })

  const onSubmit = async (data) => {
    try {
      await auth.resetPasswordTrigger(data)
      toast.info(
        "If an account exists, a reset link has been sent to the registered email. It may take a few minutes to appear"
      )
      navigate("/login", { replace: true })
    } catch (ex) {
      if (ex.response?.status === 404) {
        form.setError("identifier", {
          type: "manual",
          message: "No account found with that email or username.",
        })
      }
    }
  }
  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          key="identifier"
          control={form.control}
          name="identifier"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username or Email</FormLabel>
              <FormControl>
                <Input {...field} type="text" placeholder="Username or Email" />
              </FormControl>
              <p className="text-sm text-muted-foreground">
                {" "}
                If an account exists, a reset link will be sent via email tagged
                to account
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
        <SubmitButton
          type="submit"
          className="w-full"
          condition={form.formState.isSubmitting}
          normalText="Send Reset Link"
          loadingText="Validating..."
        />
      </form>
    </FormProvider>
  )
}

export default ForgotPassword
