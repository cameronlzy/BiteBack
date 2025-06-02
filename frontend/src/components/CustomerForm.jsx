import { useForm, FormProvider } from "react-hook-form"
import { customerSchema, cuisineList } from "@/utils/schemas"
import { safeJoiResolver } from "@/utils/safeJoiResolver"
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { MultiSelect } from "./common/MultiSelect"
import { useEffect } from "react"
import { toast } from "react-toastify"

const CustomerForm = ({ onRegister, setFormRef, user, from }) => {
  const form = useForm({
    resolver: safeJoiResolver(customerSchema),
    defaultValues: {
      role: "customer",
      username: user?.username || "",
      email: user?.email || "",
      password: "",
      confirmPassword: "",
      name: user?.profile.name || "",
      contactNumber: user?.profile.contactNumber || "",
      favCuisines: user?.profile.favCuisines || [],
    },
    mode: "onChange",
  })

  useEffect(() => {
    if (setFormRef) setFormRef(form)
  }, [setFormRef, form])

  const onSubmit = async (data) => {
    try {
      const { confirmPassword, ...cleanedData } = data
      await onRegister(cleanedData)
      localStorage.setItem(
        "toastMessage",
        user ? "Profile updated!" : "Registration successful!"
      )
      window.location = from
    } catch (ex) {
      if (ex.response?.status === 400) {
        const message = ex.response.data
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
    { name: "email", label: "Email" },
    { name: "password", label: "Password", type: "password" },
    {
      name: "confirmPassword",
      label: "Confirm Password",
      type: "password",
    },
    { name: "name", label: "Name" },
    { name: "contactNumber", label: "Contact Number" },
  ]

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {inputFields.map(({ name, label, type }) => (
          <FormField
            key={name}
            control={form.control}
            name={name}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{label}</FormLabel>
                <FormControl>
                  <Input {...field} type={type || "text"} placeholder={label} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}

        <FormField
          control={form.control}
          name="favCuisines"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Favourite Cuisines</FormLabel>
              <FormControl>
                <MultiSelect
                  options={cuisineList}
                  onChange={field.onChange}
                  selected={field.value || []}
                  placeholder="Select cuisine"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          {user ? "Update Profile" : "Register"}
        </Button>
      </form>
    </FormProvider>
  )
}

export default CustomerForm
