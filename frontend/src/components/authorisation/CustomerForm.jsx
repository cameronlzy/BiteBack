import { useForm, FormProvider } from "react-hook-form"
import { customerSchema, updateCustomerSchema } from "@/utils/schemas"
import { safeJoiResolver } from "@/utils/safeJoiResolver"
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Eye, EyeOff } from "lucide-react"
import { useState } from "react"
import { toast } from "react-toastify"
import LoadingSpinner from "../common/LoadingSpinner"
import SubmitButton from "../common/SubmitButton"
import GoogleAuthorisationButton from "./GoogleAuthorisationButton"
import { Checkbox } from "@/components/ui/checkbox"

const CustomerForm = ({
  onRegister,
  user,
  from,
  isLoading,
  isUpdate,
  googleAuth,
  handleGoogleRedirect,
}) => {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  if (isLoading) return <LoadingSpinner />
  const form = useForm({
    resolver: safeJoiResolver(user ? updateCustomerSchema : customerSchema),
    defaultValues: {
      role: "customer",
      username: user?.username || "",
      email: googleAuth ? "google-signup-bypass" : user?.email || "",
      name: user?.profile.name || "",
      contactNumber: user?.profile.contactNumber || "",
      emailOptOut: user?.profile.emailOptOut || false,
      ...(user
        ? {}
        : {
            password: "",
            confirmPassword: "",
          }),
    },
    mode: "onChange",
  })

  const onSubmit = async (data) => {
    try {
      const { confirmPassword: _confirmPassword, ...cleanedData } = data
      await onRegister(cleanedData)
      if (isUpdate) {
        localStorage.setItem("toastMessage", "Submitted!")
        window.location = from
      }
    } catch (ex) {
      if (ex.response?.status === 400) {
        const message = ex.response.data.error
        form.setError("username", {
          type: "manual",
          message: message || "Submission failed",
        })
        toast.error("Submission failed: " + message)
      }
    }
  }

  const inputFields = [
    { name: "username", label: "Username" },
    !googleAuth && { name: "email", label: "Email" },
    !user && { name: "password", label: "Password", type: "password" },
    !user && {
      name: "confirmPassword",
      label: "Confirm Password",
      type: "password",
    },
    { name: "name", label: "Name" },
    { name: "contactNumber", label: "Contact Number" },
  ].filter(Boolean)

  return (
    <>
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {inputFields.map(({ name, label, type }) => {
            const isPassword = type === "password"
            return (
              <FormField
                key={name}
                control={form.control}
                name={name}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{label}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          placeholder={label}
                          type={
                            name === "password"
                              ? showPassword
                                ? "text"
                                : "password"
                              : name === "confirmPassword"
                              ? showConfirmPassword
                                ? "text"
                                : "password"
                              : "text"
                          }
                        />
                        {isPassword && (
                          <button
                            type="button"
                            onClick={() =>
                              name === "password"
                                ? setShowPassword((prev) => !prev)
                                : setShowConfirmPassword((prev) => !prev)
                            }
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                          >
                            {name === "password" ? (
                              showPassword ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )
                            ) : showConfirmPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )
          })}

          <FormField
            control={form.control}
            name="emailOptOut"
            render={({ field }) => (
              <FormItem className="flex items-start gap-2 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Email Opt Out</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Opt out of promotional emails
                  </p>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <input type="hidden" {...field} value="customer" />
            )}
          />
          <SubmitButton
            type="submit"
            className="w-full"
            condition={form.formState.isSubmitting}
            normalText={user ? "Update Profile" : "Register"}
            loadingText={user ? "Updating..." : "Registering..."}
          />
        </form>
      </FormProvider>
      {!googleAuth && !user && (
        <GoogleAuthorisationButton
          onClick={() => handleGoogleRedirect("customer")}
        />
      )}
    </>
  )
}

export default CustomerForm
