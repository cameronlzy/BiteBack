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
import { getRestaurant, saveRestaurant } from "@/services/restaurantService"
import { toast } from "react-toastify"
import { MultiSelect } from "@/components/common/MultiSelect"
import BackButton from "./common/BackButton"
import ConfirmationPage from "./common/ConfirmationPage"

const RestaurantForm = ({ user }) => {
  const { restaurantId } = useParams()
  const navigate = useNavigate()
  const [confirming, setConfirming] = useState(false)
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
      if (user.role != "owner") {
        toast.error("You do not have permission to create restaurants.", {
          toastId: "unauthorised-restaurant-creaation",
        })
        navigate("/restaurants", { replace: true })
      }
      if (!restaurantId) return

      try {
        const restaurant = await getRestaurant(restaurantId)
        if (!restaurant) {
          navigate("/not-found", { replace: true })
          return
        }
        if (restaurant.owner !== user._id) {
          toast.error("You do not have permission to edit this restaurant.", {
            toastId: "unauthorised-restaurant-edit",
          })
          navigate("/restaurants", { replace: true })
          return
        }

        const excludedKeys = new Set(["slotDuration", "owner", "__v"])

        Object.entries(restaurant).forEach(([key, value]) => {
          if (excludedKeys.has(key)) return

          if (key === "openingHours") {
            Object.entries(value).forEach(([day, hours]) =>
              setValue(`openingHours.${day}`, hours)
            )
          } else if (key === "cuisines") {
            setValue("cuisines", value, { shouldValidate: true })
          } else if (key === "_id") {
            setValue("id", value, { shouldValidate: true })
          } else {
            setValue(key, value, { shouldValidate: true })
          }
        })
      } catch (ex) {
        console.error(
          "❌ Failed to fetch restaurant:",
          ex.response?.data || ex.message
        )
        navigate("/not-found", { replace: true })
      }
    }
    fetchRestaurant()
  }, [restaurantId, setValue, navigate])

  const watchedOpeningHours = watch("openingHours")

  const handleFirstSubmit = async () => {
    const allClosed = Object.values(getValues("openingHours")).every(
      (time) => time.toLowerCase() === "closed"
    )

    if (allClosed) {
      toast.error("At least one day must have valid opening hours.")
      return
    }

    form.unregister("rating") // Eventually no need since wont get back rating

    const valid = await trigger()
    if (valid) setConfirming(true)
  }

  const onSubmit = async (data) => {
    const cleanedData = Object.fromEntries(
      Object.entries(data).filter(([key, value]) => value !== "")
    )
    try {
      const { id, ...rest } = cleanedData
      const restaurantToSave = restaurantId
        ? { ...rest, _id: restaurantId }
        : rest
      await saveRestaurant(restaurantToSave)
      toast.success("Restaurant saved successfully!")
      navigate("/restaurants")
    } catch (ex) {
      if (ex.response && ex.response.status === 403) {
        toast.error("Not authorised to edit or create restaurant.")
      }
    }
  }

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
          {!confirming && (
            <motion.div
              key="restaurant-form"
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h2 className="text-2xl font-bold mb-4">
                {restaurantId ? "Edit" : "Create"} Restaurant
              </h2>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="space-y-2 mb-4">
                    <FormLabel>Restaurant Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. The Curry House" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="space-y-2 mb-4">
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 12 Orchard Road" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactNumber"
                render={({ field }) => (
                  <FormItem className="space-y-2 mb-4">
                    <FormLabel>Contact Number</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 91234567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maxCapacity"
                render={({ field }) => (
                  <FormItem className="space-y-2 mb-4">
                    <FormLabel>Max Capacity</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g. 50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormLabel className="font-bold mb-4">Opening Hours</FormLabel>
              {Object.keys(watchedOpeningHours || {}).map((day) => {
                const fieldName = `openingHours.${day}`
                const label = day.charAt(0).toUpperCase() + day.slice(1)

                return (
                  <FormField
                    key={day}
                    control={form.control}
                    name={fieldName}
                    render={({ field }) => (
                      <FormItem className="space-y-2 mb-4">
                        <FormLabel className="text-sm text-gray-700">
                          {label}
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
                )
              })}
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
                        onChange={(val) => field.onChange(val)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="space-y-2 mb-4">
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. contact@restaurant.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem className="space-y-2 mb-4">
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. https://restaurant.com"
                        {...field}
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
          )}

          {confirming && (
            <motion.div
              key="confirm-section"
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
                      ([day, time]) =>
                        `${day.charAt(0).toUpperCase() + day.slice(1)}: ${
                          time || "-"
                        }`
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
