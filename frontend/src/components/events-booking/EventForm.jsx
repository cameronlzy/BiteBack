import React, { useEffect, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { useForm, FormProvider } from "react-hook-form"
import { toast } from "react-toastify"
import { Input } from "@/components/ui/input"
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"

import ImageUpload from "@/components/common/ImageUpload"
import SubmitButton from "@/components/common/SubmitButton"
import { safeJoiResolver } from "@/utils/safeJoiResolver"
import { eventSchema } from "@/utils/schemas"
import {
  saveEvent,
  getEventById,
  updateEventImages,
} from "@/services/eventService"
import {
  Select,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "../ui/select"
import { objectCleaner, objectComparator } from "@/utils/objectComparator"
import { DateTime } from "luxon"
import BackButton from "../common/BackButton"
import { ownedByUserWithId } from "@/utils/ownerCheck"
import { uploadEventImages } from "@/services/eventService"
import { Info } from "lucide-react"
import DateInputRestaurant from "../common/DateInputRestaurant"
import { getRestaurant } from "@/services/restaurantService"
import { motion } from "framer-motion"

const EventForm = ({ user }) => {
  const navigate = useNavigate()
  const [mainImageFile, setMainImageFile] = useState(null)
  const [bannerImageFile, setBannerImageFile] = useState(null)
  const [event, setEvent] = useState(null)
  const [restaurant, setRestaurant] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [timeOptions, setTimeOptions] = useState([])
  const { eventId } = useParams()
  const location = useLocation()
  const from = location.state?.from || "/events"

  useEffect(() => {
    if (user.role !== "owner") {
      toast.error("Only Owners can access the Events Form", {
        toastId: "event-form-unauthorised-access",
      })
      navigate("/restaurants", { replace: true })
    }
  }, [user._id])

  useEffect(() => {
    if (!restaurant || !selectedDate) return

    const weekday = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ][selectedDate.getDay()]

    const openStr = restaurant.openingHours?.[weekday]
    console.log(openStr)
    if (!openStr || openStr.toLowerCase() === "closed") return
    const [startStr, endStr] = openStr.split("-")
    const start = DateTime.fromFormat(startStr.trim(), "HH:mm")
    const end = DateTime.fromFormat(endStr.trim(), "HH:mm")

    const hours = []
    let current = start

    while (current < end.minus({ hours: 1 })) {
      hours.push(current.toFormat("HH:mm"))
      current = current.plus({ hours: 1 })
    }
    setTimeOptions(hours)
  }, [restaurant, selectedDate])

  const form = useForm({
    resolver: safeJoiResolver(eventSchema),
    defaultValues: {
      title: "",
      description: "",
      date: "",
      startTime: "",
      endTime: "",
      paxLimit: 1,
      maxPaxPerCustomer: 1,
      remarks: "",
      minVisits: 0,
      slotPax: 1,
      restaurant: user.profile.restaurants?.[0]?._id || "",
    },
    mode: "onSubmit",
  })

  const { control, handleSubmit, formState, watch } = form

  useEffect(() => {
    const selectedRestaurantId = watch("restaurant")
    if (!selectedRestaurantId) return

    const fetchRestaurant = async () => {
      try {
        const res = await getRestaurant(selectedRestaurantId)
        setRestaurant(res)
      } catch (err) {
        console.error("Failed to fetch restaurant:", err)
      }
    }

    fetchRestaurant()
  }, [watch("restaurant")])

  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId) return
      try {
        const event = await getEventById(eventId)
        setEvent(event)

        const restaurant = await getRestaurant(event.restaurant)
        setRestaurant(restaurant)

        const isOwned = ownedByUserWithId(event?.restaurant, user)
        if (!isOwned) {
          toast.error("You are not authorised to edit this event")
          return navigate(`/events/${eventId}`, { replace: true })
        }

        const dt = DateTime.fromISO(event.startDate, { zone: "Asia/Singapore" })
        const endDt = DateTime.fromISO(event.endDate, {
          zone: "Asia/Singapore",
        })

        form.reset({
          title: event.title || "",
          description: event.description || "",
          paxLimit: event.paxLimit,
          maxPaxPerCustomer: event.maxPaxPerCustomer,
          remarks: event.remarks || "",
          restaurant: event.restaurant,
          date: dt.toJSDate(),
          startTime: dt.toFormat("HH:mm"),
          endTime: endDt.toFormat("HH:mm"),
          slotPax: event.slotPax || 1,
        })

        setSelectedDate(dt.toJSDate())

        if (event.mainImage) setMainImageFile(event.mainImage)
        if (event.bannerImage) setBannerImageFile(event.bannerImage)
      } catch {
        toast.error("Failed to fetch event")
        navigate("/not-found", { replace: true })
      }
    }

    fetchEvent()
  }, [eventId])

  useEffect(() => {
    return () => {
      if (mainImageFile) URL.revokeObjectURL(mainImageFile)
      if (bannerImageFile) URL.revokeObjectURL(bannerImageFile)
    }
  }, [mainImageFile, bannerImageFile])

  const onSubmit = async (data) => {
    const isEdit = !!eventId

    if (event && data.paxLimit < event.reservedPax) {
      form.setError("paxLimit", {
        type: "manual",
        message: `Cannot reduce pax limit below current ${event.reservedPax} reserved pax`,
      })
      return
    }

    const combinedStart = DateTime.fromJSDate(data.date)
      .setZone("Asia/Singapore")
      .set({
        hour: Number(data.startTime?.split(":")[0]),
        minute: Number(data.startTime?.split(":")[1]),
      })

    const combinedEnd = DateTime.fromJSDate(data.date)
      .setZone("Asia/Singapore")
      .set({
        hour: Number(data.endTime?.split(":")[0]),
        minute: Number(data.endTime?.split(":")[1]),
      })

    if (event && DateTime.fromISO(event.startDate) < DateTime.now()) {
      const originalStart = DateTime.fromISO(event.startDate)
      if (!combinedStart.equals(originalStart)) {
        form.setError("startDate", {
          type: "manual",
          message: "Cannot edit start date after the event has started",
        })
        return
      }
    }

    if (data.maxPaxPerCustomer > data.paxLimit) {
      form.setError("maxPaxPerCustomer", {
        type: "manual",
        message: "Max guests per booking cannot exceed total pax limit",
      })
      return
    }

    if (!mainImageFile || !bannerImageFile) {
      toast.error("Both Main and Banner images are required")
      return
    }

    try {
      const {
        startTime: _startTime,
        endTime: _endTime,
        date: _date,
        ...restData
      } = data

      const payload = {
        ...restData,
        startDate: combinedStart.toISO(),
        endDate: combinedEnd.toISO(),
      }

      const cleaned = objectCleaner(payload)
      let changes = isEdit ? objectComparator(event, cleaned) : cleaned

      if (changes.restaurant === event?.restaurant?._id) {
        delete changes.restaurant
      }
      const noChanges =
        Object.keys(changes).length === 0 &&
        !(mainImageFile instanceof File) &&
        !(bannerImageFile instanceof File)

      if (noChanges) {
        toast.info("No changes made")
        navigate(`/events/${eventId}`, { replace: true })
        return
      }
      if (isEdit) {
        changes._id = eventId
      }
      const savedEvent = await saveEvent(changes)

      const changedImages = {}
      if (mainImageFile instanceof File) changedImages.mainImage = mainImageFile
      if (bannerImageFile instanceof File)
        changedImages.bannerImage = bannerImageFile

      if (Object.keys(changedImages).length > 0) {
        if (isEdit) {
          await updateEventImages(savedEvent._id, changedImages)
        } else {
          await uploadEventImages(savedEvent._id, [
            mainImageFile,
            bannerImageFile,
          ])
        }
      }

      toast.success(isEdit ? "Event updated" : "Event created")
      navigate(`/owner/events-promos`, { replace: true })
    } catch (ex) {
      if (ex.response?.status === 400) {
        const message = ex.response.data?.error
        form.setError("startDate", {
          type: "manual",
          message: message || "Failed to save event",
        })
      }
      toast.error("Failed to save event")
      throw ex
    }
  }

  return (
    <div className="space-y-6 max-w-xl mx-auto mt-10">
      <BackButton from={from} />
      <FormProvider {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <h2 className="text-2xl font-bold mb-4">
            {eventId ? "Edit Event Details" : "Create New Event"}
          </h2>

          <FormField
            control={control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Event Title" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Event Description" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="restaurant"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Restaurant</FormLabel>
                {eventId ? (
                  <Input
                    disabled
                    value={
                      user.profile.restaurants?.find(
                        (r) => r._id === field.value
                      )?.name || "N/A"
                    }
                  />
                ) : (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a restaurant" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {user.profile.restaurants?.map((r) => (
                        <SelectItem key={r._id} value={r._id}>
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <FormMessage />
                {eventId && (
                  <div className="flex items-start text-sm text-muted-foreground mt-1">
                    <Info className="w-4 h-4 mr-1 mt-[2px]" />
                    <span>
                      Restaurant cannot be changed for existing events
                    </span>
                  </div>
                )}
              </FormItem>
            )}
          />

          {watch("restaurant") && (
            <FormField
              control={control}
              name="slotPax"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Restaurant Seats Used For Event</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max={restaurant?.maxCapacity || 100}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {watch("restaurant") && (
            <div className="flex justify-center">
              <DateInputRestaurant
                startDate={selectedDate}
                updateDate={(date) => {
                  setSelectedDate(date)
                  form.setValue("date", date)
                }}
                existingItems={[]}
                restaurant={user.profile.restaurants.find(
                  (r) => r._id === watch("restaurant")
                )}
                type="event"
              />
            </div>
          )}

          {selectedDate && timeOptions.length > 0 && (
            <motion.div
              key="time-select"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-3"
            >
              <FormField
                control={control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Start Time" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {timeOptions.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="endTime"
                render={({ field }) => {
                  const startTime = watch("startTime")
                  const filteredOptions = startTime
                    ? timeOptions.filter((t) => t > startTime)
                    : timeOptions

                  return (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select End Time" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {filteredOptions.length > 0 ? (
                            filteredOptions.map((time) => (
                              <SelectItem key={time} value={time}>
                                {time}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem disabled value="">
                              No valid end time
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )
                }}
              />
            </motion.div>
          )}

          <FormField
            control={control}
            name="paxLimit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Pax Limit</FormLabel>
                <FormControl>
                  <Input type="number" min="1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="maxPaxPerCustomer"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max Guests per Booking</FormLabel>
                <FormControl>
                  <Input type="number" min="1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="remarks"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Remarks (max 50 words)</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Any remarks (optional)" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="minVisits"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minimum Visits Required (optional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    {...field}
                    value={field.value ?? 0}
                  />
                </FormControl>
                <FormMessage />
                <div className="flex items-start text-sm text-muted-foreground mt-1">
                  <Info className="w-4 h-4 mr-1 mt-[2px]" />
                  <span>Set to 0 for public events</span>
                </div>
              </FormItem>
            )}
          />

          <ImageUpload
            index={0}
            selectedFiles={mainImageFile ? [mainImageFile] : []}
            setSelectedFiles={(files) => setMainImageFile(files[0] || null)}
            message="Upload Main Image (1 only)"
            title="Main Image"
            firstRequired={true}
            maxFiles={1}
          />

          <ImageUpload
            index={1}
            selectedFiles={bannerImageFile ? [bannerImageFile] : []}
            setSelectedFiles={(files) => setBannerImageFile(files[0] || null)}
            message="Upload Banner Image (1 only)"
            title="Banner Image"
            firstRequired={true}
            maxFiles={1}
          />

          <SubmitButton
            type="submit"
            className="w-full"
            condition={formState.isSubmitting}
            normalText={eventId ? "Update Event" : "Create Event"}
            loadingText="Submitting..."
          />
        </form>
      </FormProvider>
    </div>
  )
}

export default EventForm
