import {
  useForm,
  useFieldArray,
  FormProvider,
  Controller,
} from "react-hook-form"
import { useEffect, useState } from "react"
import {
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
import { Eye, EyeOff } from "lucide-react"
import {
  cuisineList,
  ownerSchema,
  tagList,
  updateOwnerSchema,
} from "@/utils/schemas"
import {
  saveRestaurants,
  uploadRestaurantImages,
} from "@/services/restaurantService"
import ImageUpload from "./common/ImageUpload"
import SubmitButton from "./common/SubmitButton"

const OwnerForm = ({ onRegister, user, from }) => {
  const [selectedFilesArray, setSelectedFilesArray] = useState([[]])
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const featureList = tagList.slice(0, 5)
  const dietaryList = tagList.slice(5)

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
    { name: "blockNumber", label: "Block / House Number" },
    { name: "streetName", label: "Street Name" },
    { name: "unitNumber", label: "Unit Number (optional)" },
    { name: "postalCode", label: "Postal Code" },
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
      companyName: user?.profile.companyName || "",
      ...(user
        ? {}
        : {
            password: "",
            confirmPassword: "",
            restaurants: [
              {
                name: "",
                blockNumber: "",
                streetName: "",
                unitNumber: "",
                postalCode: "",
                contactNumber: "",
                cuisines: [],
                features: [],
                dietary: [],
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
                isBlock: true,
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
    return () =>
      selectedFilesArray.flat().forEach((f) => URL.revokeObjectURL(f))
  }, [selectedFilesArray])

  const onSubmit = async (data) => {
    try {
      const {
        confirmPassword: _confirmPassword,
        restaurants,
        ...ownerData
      } = data
      const isUpdate = !!user

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

      const processedRestaurants = restaurants.map((rest) => {
        const {
          blockNumber,
          streetName,
          unitNumber,
          postalCode,
          isBlock,
          ...restData
        } = rest
        const trimmedBlock = blockNumber.trim()
        const trimmedStreet = streetName.trim()
        const trimmedUnit = unitNumber?.trim()
        const trimmedPostal = postalCode.trim()

        const address = `${
          isBlock ? "Blk " : ""
        }${trimmedBlock} ${trimmedStreet}${
          trimmedUnit ? " " + trimmedUnit : ""
        }, S${trimmedPostal}`
        const tags = [...(rest.features || []), ...(rest.dietary || [])]
        const {
          features: _features,
          dietary: _dietary,
          ...restNoFeatDiet
        } = restData
        return {
          ...restNoFeatDiet,
          address,
          tags,
        }
      })

      await onRegister(ownerData)

      if (!isUpdate) {
        const savedRestaurantIds = await saveRestaurants(processedRestaurants)

        for (let i = 0; i < savedRestaurantIds.length; i++) {
          const restaurantId = savedRestaurantIds[i]
          const files = selectedFilesArray[i] || []

          if (files.length > 0) {
            try {
              await uploadRestaurantImages(restaurantId, files)
            } catch {
              toast.error(`Image upload failed for Restaurant #${i + 1}`)
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
      if (ex.response.status === 400) {
        const message = ex.response.data.error
        form.setError("username", {
          type: "manual",
          message: message || "Submission failed",
        })
      }
      toast.error("Submission failed")
      throw ex
    }
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {baseFields.map(({ name, label, type }) => {
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

                <Controller
                  control={form.control}
                  name={`restaurants.${index}.isBlock`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address Type</FormLabel>
                      <FormControl>
                        <div className="flex space-x-4">
                          <label className="flex items-center space-x-2 text-sm text-gray-700">
                            <input
                              type="radio"
                              value="true"
                              checked={field.value === true}
                              onChange={() => field.onChange(true)}
                              className="accent-black"
                            />
                            <span>Block</span>
                          </label>
                          <label className="flex items-center space-x-2 text-sm text-gray-700">
                            <input
                              type="radio"
                              value="false"
                              checked={field.value === false}
                              onChange={() => field.onChange(false)}
                              className="accent-black"
                            />
                            <span>House</span>
                          </label>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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

                <FormField
                  control={form.control}
                  name={`restaurants.${index}.features`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Features Provided</FormLabel>
                      <FormControl>
                        <MultiSelect
                          options={featureList}
                          selected={field.value || []}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`restaurants.${index}.dietary`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dietary Requirements</FormLabel>
                      <FormControl>
                        <MultiSelect
                          options={dietaryList}
                          selected={field.value || []}
                          onChange={field.onChange}
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
                  blockNumber: "",
                  streetName: "",
                  unitNumber: "",
                  postalCode: "",
                  address: "",
                  contactNumber: "",
                  cuisines: [],
                  tags: [],
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
                  isBlock: true,
                })
                setSelectedFilesArray((prev) => [...prev, []])
              }}
            >
              Add Restaurant
            </Button>
          </>
        )}
        <SubmitButton
          type="submit"
          className="w-full"
          condition={form.formState.isSubmitting}
          normalText={user ? "Update Profile" : "Register"}
          loadingText={user ? "Updating..." : "Registering..."}
        />
      </form>
    </FormProvider>
  )
}

export default OwnerForm
