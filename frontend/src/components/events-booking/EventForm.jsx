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
import { toSGTISO } from "@/utils/timeConverter"
import { ownedByUserWithId } from "@/utils/ownerCheck"
import { uploadEventImages } from "@/services/eventService"
import { Info } from "lucide-react"

const EventForm = ({ user }) => {
  const navigate = useNavigate()
  const [mainImageFile, setMainImageFile] = useState(null)
  const [bannerImageFile, setBannerImageFile] = useState(null)
  const [event, setEvent] = useState(null)
  const { eventId } = useParams()
  const location = useLocation()
  console.log(location.state)
  const from = location.state?.from || "/events"

  useEffect(() => {
    if (user.role !== "owner") {
      toast.error("Only Owners can access the Events Form", {
        toastId: "event-form-unauthorised-access",
      })
      navigate("/restaurants", { replace: true })
    }
  }, [user._id])

  const form = useForm({
    resolver: safeJoiResolver(eventSchema),
    defaultValues: {
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      paxLimit: 1,
      maxPaxPerCustomer: 1,
      remarks: "",
      minVisits: 0,
      restaurant: user.profile.restaurants?.[0]?._id || "",
    },
    mode: "onSubmit",
  })

  const { control, handleSubmit, formState } = form

  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId) return
      try {
        const event = await getEventById(eventId)
        setEvent(event)
        const isOwned = ownedByUserWithId(event?.restaurant, user)
        if (!isOwned) {
          toast.error("You are not authorised to edit this event")
          return navigate(`/events/${eventId}`, { replace: true })
        }
        form.reset({
          title: event.title || "",
          description: event.description || "",
          startDate: event.startDate?.slice(0, 16),
          endDate: event.endDate?.slice(0, 16),
          paxLimit: event.paxLimit,
          maxPaxPerCustomer: event.maxPaxPerCustomer,
          remarks: event.remarks || "",
          restaurant: event.restaurant._id,
        })
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

  const localMin = DateTime.local().toFormat("yyyy-LL-dd'T'HH:mm")

  const onSubmit = async (data) => {
    if (event && data.paxLimit < event.reservedPax) {
      form.setError("paxLimit", {
        type: "manual",
        message: `Cannot reduce pax limit below current ${event.reservedPax} reserved pax`,
      })
      return
    }
    if (event && DateTime.fromISO(event.startDate) < DateTime.now()) {
      if (data.startDate !== event.startDate?.slice(0, 16)) {
        form.setError("startDate", {
          type: "manual",
          message: "Cannot edit start date after the event has started",
        })
        return
      }

      if (data.maxPaxPerCustomer > data.paxLimit) {
        form.setError("maxPaxPerCustomer", {
          type: "manual",
          message: "Max guests per booking cannot exceed total pax limit",
        })
        return
      }
    }
    try {
      if (!mainImageFile || !bannerImageFile) {
        toast.error("Both Main and Banner images are required")
        return
      }

      const isEdit = !!eventId
      const payload = { ...data }

      if (data.startDate) payload.startDate = toSGTISO(data.startDate)
      if (data.endDate) payload.endDate = toSGTISO(data.endDate)
      if (isEdit) payload._id = eventId

      const cleaned = objectCleaner(payload)

      let changes = eventId ? objectComparator(event, cleaned) : cleaned
      if (changes.restaurant === event?.restaurant?._id) {
        delete changes.restaurant
      }

      if (
        Object.keys(changes).length === 0 &&
        !(mainImageFile instanceof File) &&
        !(bannerImageFile instanceof File)
      ) {
        toast.info("No changes made")
        navigate(`/events/${eventId}`, { replace: true })
        return
      }

      if (eventId) changes._id = eventId

      const newevent = await saveEvent(changes)

      const changedImages = {}
      if (mainImageFile instanceof File) changedImages.mainImage = mainImageFile
      if (bannerImageFile instanceof File)
        changedImages.bannerImage = bannerImageFile
      if (Object.keys(changedImages).length > 0) {
        if (isEdit) {
          await updateEventImages(newevent._id, changedImages)
        } else {
          await uploadEventImages(newevent._id, [
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
          message: message || "Failed",
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
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date & Time</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} min={localMin} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Date & Time</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} min={localMin} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
            name="restaurant"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Restaurant</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
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
                  <span>Set to 0 for public events.</span>
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
