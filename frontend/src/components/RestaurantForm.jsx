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
import { cuisineList, restaurantSchema } from "@/utils/schemas"
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
import { objectComparator } from "@/utils/objectComparator"
import ImageUpload from "./common/ImageUpload"

const RestaurantForm = ({ user }) => {
  const { restaurantId } = useParams()
  const navigate = useNavigate()
  const [existingRestaurant, setExistingRestaurant] = useState(null)
  const [confirming, setConfirming] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [existingImageUrls, setExistingImageUrls] = useState([])
  const from = "/restaurants" + (restaurantId ? `/${restaurantId}` : "")

  const form = useForm({
    resolver: safeJoiResolver(restaurantSchema),
    mode: "onSubmit",
    defaultValues: {
      id: undefined,
      name: "",
      address: "",
      contactNumber: "",
      cuisines: [],
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

  const {
    handleSubmit,
    setValue,
    getValues,
    trigger,
    watch,
    formState: { errors },
  } = form

  useEffect(() => {
    const fetchRestaurant = async () => {
      if (user.role !== "owner") {
        toast.error("You do not have permission to create restaurants.")
        return navigate("/restaurants", { replace: true })
      }

      if (!restaurantId) return

      try {
        const restaurant = await getRestaurant(restaurantId)

        if (!restaurant || restaurant.owner !== user._id) {
          toast.error("Unauthorized to edit this restaurant.")
          return navigate("/restaurants", { replace: true })
        }

        setExistingRestaurant(restaurant)
        if (Array.isArray(restaurant.images)) {
          setExistingImageUrls(restaurant.images)
        }
        const allowedKeys = new Set([
          "name",
          "address",
          "contactNumber",
          "maxCapacity",
          "email",
          "website",
          "cuisines",
          "openingHours",
          "_id",
        ])

        Object.entries(restaurant).forEach(([key, val]) => {
          if (!allowedKeys.has(key)) return

          if (key === "openingHours" && typeof val === "object") {
            Object.entries(val).forEach(([day, hours]) =>
              setValue(`openingHours.${day}`, hours)
            )
          } else if (key === "cuisines") {
            setValue("cuisines", val)
          } else if (key === "_id") {
            setValue("id", val)
          } else {
            setValue(key, val)
          }
        })
      } catch (ex) {
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
    const { id, ...cleaned } = data

    try {
      const cleanedNoEmpty = Object.fromEntries(
        Object.entries(cleaned).filter(([_, v]) => v !== "")
      )

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

      if (selectedFiles.length > 0) {
        const newFiles = selectedFiles.filter((f) => f instanceof File)
        const keptUrls = selectedFiles.filter((f) => typeof f === "string")

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
      // Custom rollback here
      toast.error("Error saving restaurant")
      console.error(ex)
    }
  }

  const fields = [
    { name: "name", label: "Restaurant Name" },
    { name: "address", label: "Address" },
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
              {fields.map(({ name, label }) => (
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
              ))}
              <ImageUpload
                firstRequired={true}
                message="First image is for thumbnail and subsequent 4 images are for the menu"
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
                formName="Restaurant"
                details={{
                  Name: getValues("name"),
                  Address: getValues("address"),
                  "Contact Number": getValues("contactNumber"),
                  "Max Capacity": getValues("maxCapacity"),
                  Email: getValues("email"),
                  Website: getValues("website"),
                  Cuisines: getValues("cuisines")?.join(", ") || "-",
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
