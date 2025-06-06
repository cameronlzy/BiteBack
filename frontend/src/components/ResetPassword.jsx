import { useForm, FormProvider } from "react-hook-form"
import { passwordResetSchema } from "../utils/schemas"
import auth from "../services/authService"
import { toast } from "react-toastify"
import { useNavigate, useParams } from "react-router-dom"
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
import { changePassword } from "@/services/userService"

const ResetPassword = ({ user }) => {
  const navigate = useNavigate()
  const { token } = useParams()
  const form = useForm({
    resolver: safeJoiResolver(passwordResetSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
    mode: "onChange",
  })

  const onSubmit = async (data) => {
    try {
      const { confirmPassword, ...finalData } = data
      user
        ? await changePassword(finalData, user.role)
        : await auth.resetPasswordSubmit(token, finalData)
      toast.success("Password Reset Successfully")
      navigate("/me", { replace: true })
    } catch (ex) {
      if (ex.response?.status === 401 || ex.response?.status === 400) {
        form.setError("password", {
          type: "manual",
          message: "Not a valid reset password link or Link has expired",
        })
      }
    }
  }
  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <h1 className="text-2xl font-bold">
          {user ? "Change Password" : "Reset Password"}
        </h1>
        <FormField
          key="password"
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Password</FormLabel>
              <FormControl>
                <Input {...field} type="password" placeholder="New Password" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          key="confirmPassword"
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="password"
                  placeholder="Confirm Password"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">
          Reset Password
        </Button>
      </form>
    </FormProvider>
  )
}

export default ResetPassword
