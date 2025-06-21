import { useForm, FormProvider } from "react-hook-form"
import { passwordResetSchema, passwordChangeSchema } from "../utils/schemas"
import auth from "../services/authService"
import { toast } from "react-toastify"
import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { safeJoiResolver } from "@/utils/safeJoiResolver"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form"
import { Input } from "./ui/input"
import BackButton from "./common/BackButton"
import SubmitButton from "./common/SubmitButton"

const ResetPassword = ({ user }) => {
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const from = location?.state?.from || "/"
  const { token } = useParams()
  const form = useForm({
    resolver: safeJoiResolver(
      user ? passwordChangeSchema : passwordResetSchema
    ),
    defaultValues: user
      ? {
          oldPassword: "",
          password: "",
          confirmPassword: "",
        }
      : {
          password: "",
          confirmPassword: "",
        },
    mode: "onChange",
  })

  const onSubmit = async (data) => {
    try {
      const { confirmPassword: _confirmPassword, ...finalData } = data
      user
        ? await auth.changePassword(finalData)
        : await auth.resetPasswordSubmit(token, finalData)
      toast.success("Password Reset Successfully")
      navigate("/me", { replace: true })
    } catch (ex) {
      if (ex.response?.status === 401 && token) {
        form.setError("password", {
          type: "manual",
          message: "Not a valid reset password link or Link has expired",
        })
      }
      if (user && ex.response?.status === 400) {
        form.setError("oldPassword", {
          type: "manual",
          message: "Old Password is incorrect",
        })
      }
    }
  }
  return (
    <div>
      <BackButton from={from} />
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <h1 className="text-2xl font-bold">
            {user ? "Change Password" : "Reset Password"}
          </h1>
          {user && (
            <FormField
              key="oldPassword"
              control={form.control}
              name="oldPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Old Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type={showOldPassword ? "text" : "password"}
                        placeholder="Old Password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPassword((prev) => !prev)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                      >
                        {showOldPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <FormField
            key="password"
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      type={showPassword ? "text" : "password"}
                      placeholder="New Password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
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
                  <div className="relative">
                    <Input
                      {...field}
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm Password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <SubmitButton
            type="submit"
            className="w-full"
            condition={form.formState.isSubmitting}
            normalText={user ? "Change Password" : "Reset Password"}
            loadingText={user ? "Updating..." : "Resetting..."}
          />
        </form>
      </FormProvider>
    </div>
  )
}

export default ResetPassword
