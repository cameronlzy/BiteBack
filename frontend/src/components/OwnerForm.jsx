import { useForm, useFieldArray, FormProvider } from "react-hook-form"
import { safeJoiResolver } from "@/utils/safeJoiResolver"
import { cuisineList, ownerSchema } from "@/utils/schemas"
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
import { useEffect } from "react"
import { MultiSelect } from "./common/MultiSelect"
import OpeningHoursSelect from "./OpeningHoursSelect"
import { toast } from "react-toastify"

const OwnerForm = ({ onRegister, setFormRef, user, from }) => {
  const form = useForm({
    resolver: safeJoiResolver(ownerSchema),
    defaultValues: {
      role: "owner",
      username: user?.username || "",
      email: user?.email || "",
      password: "",
      confirmPassword: "",
      companyName: user?.companyName || "",
      restaurants: user?.restaurants?.length
        ? user.restaurants
        : [
            {
              name: "",
              address: "",
              contactNumber: "",
              cuisines: [],
              maxCapacity: "",
              openingHours: {
                monday: "",
                tuesday: "",
                wednesday: "",
                thursday: "",
                friday: "",
                saturday: "",
                sunday: "",
              },
              email: "",
              website: "",
            },
          ],
    },
    mode: "onChange",
    shouldUnregister: false,
  })

  useEffect(() => {
    if (setFormRef) setFormRef(form)
  }, [setFormRef, form])

  useEffect(() => {
    if (user) {
      form.setValue("restaurants", undefined)
    }
  }, [user])

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "restaurants",
  })

  const onSubmit = async (data) => {
    try {
      const { confirmPassword, ...cleanedData } = data
      const finalData = { ...cleanedData }
      if (user) delete finalData.restaurants
      await onRegister(finalData)
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

  const baseFields = [
    { name: "username", label: "Username" },
    { name: "email", label: "Email" },
    { name: "password", label: "Password", type: "password" },
    {
      name: "confirmPassword",
      label: "Confirm Password",
      type: "password",
    },
    { name: "companyName", label: "Company Name" },
  ]

  const restaurantFields = [
    { name: "name", label: "Restaurant Name" },
    { name: "address", label: "Address" },
    { name: "contactNumber", label: "Contact Number" },
    { name: "maxCapacity", label: "Max Capacity" },
    { name: "email", label: "Email" },
    { name: "website", label: "Website" },
  ]

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {baseFields.map(({ name, label, type }) => (
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

        {!user && (
          <>
            {fields.map((_, index) => (
              <div key={index} className="border p-4 rounded-md space-y-4">
                <div className="flex justify-between items-center">
                  <b className="text-lg">Restaurant Details</b>
                  {index > 0 && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => remove(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>

                {restaurantFields.map(({ name, label }) => (
                  <FormField
                    key={name}
                    control={form.control}
                    name={`restaurants.${index}.${name}`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{label}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            onChange={(e) => {
                              field.onChange(e)
                              form.trigger(`restaurants.${index}.${name}`)
                            }}
                            placeholder={label}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}

                <FormField
                  control={form.control}
                  name={`restaurants.${index}.cuisines`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cuisines</FormLabel>
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

                <OpeningHoursSelect
                  index={index}
                  control={form.control}
                  setValue={form.setValue}
                  trigger={form.trigger}
                />
              </div>
            ))}

            <Button
              type="button"
              onClick={() =>
                append({
                  name: "",
                  address: "",
                  contactNumber: "",
                  cuisines: [],
                  maxCapacity: "",
                  openingHours: {
                    monday: "",
                    tuesday: "",
                    wednesday: "",
                    thursday: "",
                    friday: "",
                    saturday: "",
                    sunday: "",
                  },
                  email: "",
                  website: "",
                })
              }
            >
              Add Restaurant
            </Button>
          </>
        )}

        <Button type="submit" className="w-full">
          {user ? "Update Profile" : "Register"}
        </Button>
      </form>
    </FormProvider>
  )
}

export default OwnerForm
