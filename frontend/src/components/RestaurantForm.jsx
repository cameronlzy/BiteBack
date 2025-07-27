import { Controller, FormProvider, useForm } from "react-hook-form"
import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"
import { safeJoiResolver } from "@/utils/safeJoiResolver"
import { cuisineList, restaurantSchema, tagList } from "@/utils/schemas"
import {
  getRestaurant,
  saveRestaurant,
  updateRestaurantImages,
  uploadRestaurantImages,
} from "@/services/restaurantService"
import { toast } from "react-toastify"
import { MultiSelect } from "@/components/common/MultiSelect"
import BackButton from "./common/BackButton"
import ConfirmationPage from "./common/ConfirmationPage"
import { objectCleaner, objectComparator } from "@/utils/objectComparator"
import ImageUpload from "./common/ImageUpload"
import { ownedByUser } from "@/utils/ownerCheck"

const RestaurantForm = ({ user }) => {
  const { restaurantId } = useParams()
  const navigate = useNavigate()
  const [existingRestaurant, setExistingRestaurant] = useState(null)
  const [confirming, setConfirming] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [existingImageUrls, setExistingImageUrls] = useState([])
  const from = "/restaurants" + (restaurantId ? `/${restaurantId}` : "")

  const featureList = tagList.slice(0, 5)
  const dietaryList = tagList.slice(5)

  const form = useForm({
    resolver: safeJoiResolver(restaurantSchema),
    mode: "onSubmit",
    defaultValues: {
      id: undefined,
      name: "",
      blockNumber: "",
      streetName: "",
      unitNumber: "",
      postalCode: "",
      contactNumber: "",
      cuisines: [],
      features: [],
      dietary: [],
      openingHours: {
        monday: "",
        tuesday: "",
        wednesday: "",
        thursday: "",
        friday: "",
        saturday: "",
        sunday: "",
      },
      maxCapacity: "",
      email: "",
      website: "",
    },
  })

  const { handleSubmit, setValue, getValues, trigger, watch } = form

  useEffect(() => {
    const fetchRestaurant = async () => {
      if (user.role !== "owner") {
        toast.error("You do not have permission to create restaurants.")
        return navigate("/restaurants", { replace: true })
      }

      if (!restaurantId) return

      try {
        const restaurant = await getRestaurant(restaurantId)
        if (!restaurant || !ownedByUser(restaurant, user)) {
          toast.error("Unauthorised to edit this restaurant.")
          return navigate("/restaurants", { replace: true })
        }

        setExistingRestaurant(restaurant)
        if (Array.isArray(restaurant.images)) {
          setExistingImageUrls(restaurant.images)
        }

        const parsedAddress = restaurant.address?.match(
          /^(?:Blk\s*)?(\d+[A-Za-z]?)\s+(.+?)(?:\s+(#\S+))?\s*,\s*S(\d{6})$/
        )

        if (parsedAddress) {
          const fullStreet = parsedAddress[2].trim()
          const possibleDuplicate = fullStreet.startsWith(
            parsedAddress[1] + " "
          )
          setValue("blockNumber", parsedAddress[1])
          setValue(
            "streetName",
            possibleDuplicate
              ? fullStreet.slice(parsedAddress[1].length + 1)
              : fullStreet
          )
          setValue("unitNumber", parsedAddress[3] || "")
          setValue("postalCode", parsedAddress[4])
          const isBlock = /^Blk\s+/i.test(restaurant.address || "")
          setValue("isBlock", isBlock)
        }

        if (Array.isArray(restaurant.tags)) {
          const features = restaurant.tags.filter((tag) =>
            featureList.includes(tag)
          )
          const dietary = restaurant.tags.filter((tag) =>
            dietaryList.includes(tag)
          )
          setValue("features", features)
          setValue("dietary", dietary)
        }

        const allowedKeys = new Set([
          "name",
          "contactNumber",
          "maxCapacity",
          "email",
          "website",
          "cuisines",
          "features",
          "dietary",
          "openingHours",
          "_id",
        ])

        Object.entries(restaurant).forEach(([key, val]) => {
          if (!allowedKeys.has(key)) return

          if (key === "openingHours" && typeof val === "object") {
            Object.entries(val).forEach(([day, hours]) =>
              setValue(`openingHours.${day}`, hours)
            )
          } else if (key === "_id") {
            setValue("id", val)
          } else {
            setValue(key, val)
          }
        })
      } catch {
        toast.error("Failed to fetch restaurant")
        navigate("/not-found", { replace: true })
      }
    }

    fetchRestaurant()
  }, [restaurantId])

  useEffect(() => {
    return () => selectedFiles.forEach((file) => URL.revokeObjectURL(file))
  }, [selectedFiles])

  useEffect(() => {
    if (existingImageUrls.length > 0 && selectedFiles.length === 0) {
      setSelectedFiles(existingImageUrls)
    }
  }, [existingImageUrls])

  const watchedOpeningHours = watch("openingHours")

  const handleFirstSubmit = async () => {
    const allClosed = Object.values(getValues("openingHours")).every(
      (val) => val.toLowerCase() === "closed"
    )
    if (allClosed) {
      return toast.error("At least one day must be open")
    }

    if (selectedFiles.length === 0) {
      return toast.error("Please upload at least one image")
    }
    if (await trigger()) {
      setConfirming(true)
    }
  }

  const onSubmit = async (data) => {
    const {
      id: _id,
      isBlock,
      blockNumber,
      streetName,
      unitNumber,
      postalCode,
      features,
      dietary,
      ...rest
    } = data

    const address = `${isBlock ? "Blk " : ""}${blockNumber} ${streetName}${
      unitNumber ? " " + unitNumber : ""
    }, S${postalCode}`.trim()

    try {
      const tags = [...(features || []), ...(dietary || [])]

      const cleanedNoEmpty = objectCleaner({ ...rest, address, tags })

      let changes = restaurantId
        ? objectComparator(existingRestaurant, cleanedNoEmpty)
        : cleanedNoEmpty

      let finalRestaurantId = restaurantId || null

      if (!restaurantId || Object.keys(changes).length > 0) {
        const res = await saveRestaurant(
          restaurantId ? { ...changes, _id: restaurantId } : changes,
          !!restaurantId
        )
        if (!restaurantId) finalRestaurantId = res._id
      }

      const newFiles = selectedFiles.filter((f) => f instanceof File)
      const keptUrls = selectedFiles.filter((f) => typeof f === "string")

      const imagesChanged =
        newFiles.length > 0 ||
        existingImageUrls.length !== keptUrls.length ||
        !keptUrls.every((url) => existingImageUrls.includes(url))

      if (!restaurantId) {
        if (newFiles.length === 0) {
          toast.error("Please upload at least one image")
          return
        }

        await uploadRestaurantImages(finalRestaurantId, newFiles)
      } else if (imagesChanged) {
        let newImageUrls = []

        if (newFiles.length > 0) {
          newImageUrls = await uploadRestaurantImages(
            finalRestaurantId,
            newFiles
          )
          newImageUrls = newImageUrls.filter(
            (url) => !existingImageUrls.includes(url)
          )
        }

        const updatedUrls = [...keptUrls, ...newImageUrls]
        await updateRestaurantImages(finalRestaurantId, updatedUrls)
      }

      toast.success("Restaurant saved successfully!")
      navigate("/restaurants")
    } catch (ex) {
      toast.error("Error saving restaurant")
      console.error(ex)
    }
  }

  const fields = [
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

  return (
    <FormProvider {...form}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="max-w-2xl mx-auto mt-10 p-6 border rounded-lg shadow space-y-6"
      >
        <BackButton
          from={from}
          confirming={confirming}
          setConfirming={setConfirming}
        />
        <AnimatePresence mode="wait">
          {!confirming ? (
            <motion.div
              key="form"
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h2 className="text-2xl font-bold mb-4">
                {restaurantId ? "Edit" : "Create"} Restaurant
              </h2>
              {fields.map(({ name, label }) => {
                if (name === "blockNumber") {
                  return (
                    <div key="isBlock-and-blockNumber">
                      <Controller
                        control={form.control}
                        name="isBlock"
                        render={({ field }) => (
                          <FormItem className="space-y-2 mb-4">
                            <FormLabel>Address Type</FormLabel>
                            <FormControl>
                              <div className="flex items-center space-x-4">
                                <label className="flex items-center space-x-2 text-sm text-gray-700">
                                  <input
                                    type="radio"
                                    checked={field.value === true}
                                    onChange={() => field.onChange(true)}
                                    className="accent-black"
                                  />
                                  <span>Block</span>
                                </label>
                                <label className="flex items-center space-x-2 text-sm text-gray-700">
                                  <input
                                    type="radio"
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

                      <FormField
                        key={name}
                        control={form.control}
                        name={name}
                        render={({ field }) => (
                          <FormItem className="space-y-2 mb-4">
                            <FormLabel>{label}</FormLabel>
                            <FormControl>
                              <Input placeholder={label} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )
                }

                return (
                  <FormField
                    key={name}
                    control={form.control}
                    name={name}
                    render={({ field }) => (
                      <FormItem className="space-y-2 mb-4">
                        <FormLabel>{label}</FormLabel>
                        <FormControl>
                          <Input placeholder={label} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )
              })}
              <ImageUpload
                firstRequired={true}
                message="First image is for thumbnail and subsequent 4 will be placed in the gallery"
                selectedFiles={selectedFiles}
                setSelectedFiles={setSelectedFiles}
              />
              <FormLabel className="font-bold mb-4">Opening Hours</FormLabel>
              {Object.keys(watchedOpeningHours || {}).map((day) => (
                <FormField
                  key={day}
                  control={form.control}
                  name={`openingHours.${day}`}
                  render={({ field }) => (
                    <FormItem className="space-y-2 mb-4">
                      <FormLabel>
                        {day[0].toUpperCase() + day.slice(1)}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. 10:00-22:00 or Closed"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
              <Controller
                control={form.control}
                name="cuisines"
                render={({ field }) => (
                  <FormItem className="space-y-2 mb-4">
                    <FormLabel>Cuisines</FormLabel>
                    <FormControl>
                      <MultiSelect
                        options={cuisineList}
                        selected={field.value || []}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Controller
                control={form.control}
                name="features"
                render={({ field }) => (
                  <FormItem className="space-y-2 mb-4">
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

              <Controller
                control={form.control}
                name="dietary"
                render={({ field }) => (
                  <FormItem className="space-y-2 mb-4">
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
              <Button
                type="button"
                className="w-full mt-4"
                onClick={handleFirstSubmit}
              >
                Verify Details
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="confirm"
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 100, opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <ConfirmationPage
                isSubmitting={form.formState.isSubmitting}
                formName="Restaurant"
                details={{
                  Name: getValues("name"),
                  Address: `${getValues("blockNumber")} ${getValues(
                    "streetName"
                  )} ${getValues("unitNumber")}, Singapore ${getValues(
                    "postalCode"
                  )}`,
                  "Contact Number": getValues("contactNumber"),
                  "Max Capacity": getValues("maxCapacity"),
                  Email: getValues("email"),
                  Website: getValues("website"),
                  Cuisines: getValues("cuisines")?.join(", ") || "-",
                  Features: getValues("features")?.join(", ") || "-",
                  Dietary: getValues("dietary")?.join(", ") || "-",
                  "Opening Hours": Object.entries(
                    getValues("openingHours") || {}
                  )
                    .map(
                      ([d, t]) =>
                        `${d[0].toUpperCase() + d.slice(1)}: ${t || "-"}`
                    )
                    .join(" | "),
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </FormProvider>
  )
}

export default RestaurantForm
