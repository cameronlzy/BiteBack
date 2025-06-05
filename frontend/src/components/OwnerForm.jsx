import { useForm, useFieldArray, FormProvider } from "react-hook-form"
import { useEffect, useState } from "react"
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
import OpeningHoursSelect from "./OpeningHoursSelect"
import { toast } from "react-toastify"
import { safeJoiResolver } from "@/utils/safeJoiResolver"
import { cuisineList, ownerSchema, updateOwnerSchema } from "@/utils/schemas"
import { uploadRestaurantImages } from "@/services/restaurantService"
import ImageUpload from "./common/ImageUpload"
import LoadingSpinner from "./common/LoadingSpinner"

const OwnerForm = ({ onRegister, setFormRef, user, from, isLoading }) => {
  const [selectedFilesArray, setSelectedFilesArray] = useState([[]])

  const baseFields = [
    { name: "username", label: "Username" },
    { name: "email", label: "Email" },
    !user && { name: "password", label: "Password", type: "password" },
    !user && {
      name: "confirmPassword",
      label: "Confirm Password",
      type: "password",
    },
    { name: "companyName", label: "Company Name" },
  ].filter(Boolean)

  const restaurantFields = [
    { name: "name", label: "Restaurant Name" },
    { name: "address", label: "Address" },
    { name: "contactNumber", label: "Contact Number" },
    { name: "maxCapacity", label: "Max Capacity" },
    { name: "email", label: "Email" },
    { name: "website", label: "Website" },
  ]

  const form = useForm({
    resolver: safeJoiResolver(user ? updateOwnerSchema : ownerSchema),
    defaultValues: {
      role: "owner",
      username: user?.username || "",
      email: user?.email || "",
      companyName: user?.companyName || "",
      ...(user
        ? {}
        : {
            password: "",
            confirmPassword: "",
            restaurants: [
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
          }),
    },
    mode: "onSubmit",
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "restaurants",
  })

  useEffect(() => {
    if (setFormRef) setFormRef(form)
  }, [form, setFormRef])

  useEffect(() => {
    return () =>
      selectedFilesArray.flat().forEach((f) => URL.revokeObjectURL(f))
  }, [selectedFilesArray])

  const onSubmit = async (data) => {
    try {
      const { confirmPassword, ...finalData } = data
      const isUpdate = !!user
      if (isUpdate) delete finalData.restaurants

      if (!isUpdate) {
        const missingImageIndex = selectedFilesArray.findIndex(
          (files) => !files || files.length === 0
        )
        if (missingImageIndex !== -1) {
          toast.error(
            `Restaurant #${missingImageIndex + 1} requires at least one image.`
          )
          return
        }
      }

      const result = await onRegister(finalData)
      if (!isUpdate && result?.data?.restaurants?.length > 0) {
        for (let i = 0; i < result.data.restaurants.length; i++) {
          const restaurantId = result.data.restaurants[i]
          const files = selectedFilesArray[i] || []
          if (files.length > 0) {
            try {
              await uploadRestaurantImages(restaurantId, files)
            } catch (e) {
              toast.error(`Image upload failed for restaurant #${i + 1}`)
            }
          }
        }
      }
      toast.success("Images uploaded successfully")
      localStorage.setItem(
        "toastMessage",
        isUpdate ? "Profile updated!" : "Registration successful!"
      )
      window.location = from
    } catch (ex) {
      toast.error("Submission failed")
    }
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {baseFields.map(({ name, label, type }) => (
          <FormField
            key={name}
            control={form.control}
            name={name}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{label}</FormLabel>
                <FormControl>
                  <Input {...field} placeholder={label} type={type || "text"} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}

        {!user && (
          <>
            {fields.map((_, index) => (
              <div key={index} className="space-y-4 border p-4 rounded-md">
                <div className="flex justify-between">
                  <b>Restaurant Details</b>
                  {index > 0 && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => {
                        remove(index)
                        setSelectedFilesArray((prev) =>
                          prev.filter((_, i) => i !== index)
                        )
                      }}
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
                          <Input {...field} placeholder={label} />
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
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <ImageUpload
                  index={index}
                  firstRequired={true}
                  message="First image is for thumbnail and subsequent 4 images are for the menu"
                  selectedFiles={selectedFilesArray[index]}
                  setSelectedFiles={(files) => {
                    setSelectedFilesArray((prev) => {
                      const copy = [...prev]
                      copy[index] = files
                      return copy
                    })
                  }}
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
              onClick={() => {
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
                setSelectedFilesArray((prev) => [...prev, []])
              }}
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
