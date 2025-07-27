import { useEffect, useState } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faUser } from "@fortawesome/free-solid-svg-icons"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "../ui/button"
import { useForm, FormProvider } from "react-hook-form"
import {
  getRestaurant,
  getRestaurantAvailability,
} from "@/services/restaurantService"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { safeJoiResolver } from "@/utils/safeJoiResolver"
import { reservationSchema } from "@/utils/schemas"
import {
  getIndividualReservation,
  getReservations,
  saveReservation,
} from "@/services/reservationService"
import { toast } from "react-toastify"
import { readableTimeSettings } from "@/utils/timeConverter"
import { DateTime } from "luxon"
import BackButton from "../common/BackButton"
import ConfirmationPage from "../common/ConfirmationPage"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form"
import { Input } from "../ui/input"
import LoadingSpinner from "../common/LoadingSpinner"
import { objectCleaner, objectComparator } from "@/utils/objectComparator"
import { ownedByUser } from "@/utils/ownerCheck"
import DateInputRestaurant from "../common/DateInputRestaurant"

const ReservationForm = ({ user }) => {
  const [showReservation, setShowReservation] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [restaurant, setRestaurant] = useState(null)
  const [existingReservations, setExistingReservations] = useState([])
  const [availableSlots, setAvailableSlots] = useState([])
  const { restaurantId, reservationId } = useParams()
  const [preloadedTimeSlot, setPreloadedTimeSlot] = useState(null)
  const [preloadedPax, setPreloadedPax] = useState(null)
  const [preloadedReservationDate, setPreloadedReservationDate] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()
  const from = location?.state?.from || "/restaurants/" + restaurantId

  const form = useForm({
    resolver: safeJoiResolver(reservationSchema),
    mode: "onSubmit",
    defaultValues: {
      pax: undefined,
      startDate: undefined,
      remarks: "",
    },
  })

  const {
    setValue,
    handleSubmit,
    watch,
    formState: { errors },
    trigger,
    getValues,
  } = form

  useEffect(() => {
    async function fetchExistingReservations() {
      const bookings = await getReservations({ page: 1, limit: 10 })
      setExistingReservations(bookings.reservations)
    }
    fetchExistingReservations()
  }, [user])

  // Work on When to When appear also

  useEffect(() => {
    async function fetchRestaurant() {
      try {
        const res = await getRestaurant(restaurantId)
        setRestaurant(res)
      } catch (ex) {
        if (ex.response && ex.response.status === 404) {
          navigate("/not-found", { replace: true })
          return
        }
        toast.error("Failed to fetch restaurant details")
      }
    }
    fetchRestaurant()
  }, [restaurantId, navigate])

  const isOwnedByUser = ownedByUser(restaurant, user)

  useEffect(() => {
    if (!restaurant || !user) return

    if (user.role !== "customer" && !isOwnedByUser) {
      toast.error(
        "Only customers or the restaurant owner can access this page",
        {
          toastId: "reservation-access",
        }
      )
      navigate("/restaurants/" + restaurantId, { replace: true })
    }
  }, [restaurant, user, navigate, restaurantId])

  useEffect(() => {
    if (!restaurant || !reservationId) return

    const preloadReservation = async () => {
      try {
        const reservation = await getIndividualReservation(reservationId)

        if (reservation.event) {
          toast.error("Editing events is not allowed", {
            toastId: "event-edit-block",
          })
          navigate("/me", { replace: true })
          return
        }

        if (String(reservation?.customer) !== String(user.profile._id)) {
          toast.error("You are not authorised to view this reservation", {
            toastId: "unauthorised-reservation",
          })
          navigate(`/reservation/${restaurantId}`, { replace: true })
          return
        }

        const newReservationDate = DateTime.fromISO(reservation.startDate, {
          zone: "Asia/Singapore",
        }).toJSDate()
        setPreloadedReservationDate(newReservationDate)
        setPreloadedTimeSlot(
          DateTime.fromJSDate(newReservationDate).toFormat("HH:mm")
        )
        setPreloadedPax(reservation.pax)

        setValue("startDate", newReservationDate)
        setTimeout(() => {
          updateTime(DateTime.fromJSDate(newReservationDate).toFormat("HH:mm"))
        }, 100)
      } catch (ex) {
        if (ex.response?.status === 404) {
          navigate("/not-found", { replace: true })
        }
      }
    }

    preloadReservation()
  }, [reservationId, restaurant])

  useEffect(() => {
    if (!preloadedPax || availableSlots.length === 0) return

    if (!getValues("pax")) {
      setValue("pax", preloadedPax)
    }
  }, [availableSlots, preloadedPax])

  const startDate = watch("startDate")

  useEffect(() => {
    if (!startDate || !restaurant) return

    const fetchAvailability = async () => {
      const formatted = DateTime.fromJSDate(startDate)
        .setZone("Asia/Singapore")
        .startOf("day")
        .toISO()
      let slots = await getRestaurantAvailability(restaurantId, formatted)
      if (slots === -1) slots = []

      const selectedDateStr =
        DateTime.fromJSDate(startDate).toFormat("yyyy-MM-dd")
      const preloadedDateStr = preloadedReservationDate
        ? DateTime.fromJSDate(preloadedReservationDate).toFormat("yyyy-MM-dd")
        : null

      const isSameDay = selectedDateStr === preloadedDateStr

      if (isSameDay && preloadedTimeSlot && preloadedPax) {
        const existing = slots.find((s) => s.time === preloadedTimeSlot)

        if (existing) {
          existing.available += preloadedPax
        } else {
          slots.push({ time: preloadedTimeSlot, available: preloadedPax })
        }
      }

      setAvailableSlots(slots)
    }
    fetchAvailability()
  }, [startDate, restaurant])

  if (!restaurant) return <LoadingSpinner />

  const handleDateTimeChange = (date) => {
    if (date) {
      setValue("startDate", date)
    }
  }

  const updateDate = (date) => {
    if (!date) return
    const newDate = new Date(date)

    if (startDate) {
      newDate.setHours(startDate.getHours())
      newDate.setMinutes(startDate.getMinutes())
    }

    setValue("startDate", newDate)
    handleDateTimeChange(newDate)
  }

  const updateTime = (time) => {
    if (!startDate || !time) return

    const sgtTime = DateTime.fromFormat(time, "HH:mm", { zone: "utc" })

    const updated = DateTime.fromJSDate(startDate)
      .set({
        hour: sgtTime.hour,
        minute: sgtTime.minute,
        second: 0,
        millisecond: 0,
      })
      .toJSDate()

    setValue("startDate", updated)
    handleDateTimeChange(updated)
  }

  const handleFirstSubmit = async () => {
    setValue("userId", String(user._id))
    setValue("restaurantId", String(restaurant._id))
    const valid = await trigger()
    if (valid) setConfirming(true)
  }

  const onSubmit = async (data) => {
    try {
      const finalReservation = {
        restaurant: data.restaurantId,
        pax: data.pax,
        startDate: DateTime.fromJSDate(data.startDate)
          .setZone("Asia/Singapore")
          .toISO(),
        customer: user.profile._id,
        remarks: data.remarks || "",
      }
      const originalReservation = existingReservations.find(
        (r) => r._id === reservationId
      )

      const cleaned = objectCleaner(finalReservation)
      const result = objectComparator(originalReservation, cleaned)
      if (reservationId && Object.keys(result).length === 0) {
        navigate(from, {
          replace: true,
        })
        toast.info("No Changes to Booking Made")
        return
      }
      result._id = reservationId
      reservationId
        ? await saveReservation(result, true)
        : await saveReservation(cleaned, false)
      toast.success(
        reservationId ? "Edited sucessfully!" : "Reserved successfully!"
      )
      navigate(from, {
        replace: true,
      })
    } catch (ex) {
      if (ex.response && ex.response.status === 400) {
        const message = ex.response.data.error
        form.setError("startDate", {
          type: "manual",
          message: message || "Reservation failed",
        })
        toast.error("Reservation failed: " + message)
      } else if (ex.response && ex.response.status === 403) {
        toast.error("Not Authorised to make Reservation")
      }
    }
  }

  const selectedTime = startDate
    ? DateTime.fromJSDate(startDate).toFormat("HH:mm")
    : null
  const capacityForSlot = (() => {
    const slot = availableSlots.find((s) => s.time === selectedTime)
    return slot && slot.available != null ? slot.available : 0
  })()

  const availableTimeSlots = availableSlots.map((s) => s.time)

  const slotFullChecker = (time) => {
    const slot = availableSlots.find((s) => s.time === time)
    const isFull = !slot || slot.available === 0 || slot.available === null
    return isFull
  }

  return (
    <FormProvider {...form}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="max-w-md mx-auto mt-10 p-6 border rounded-lg shadow space-y-6"
      >
        <BackButton
          from={from}
          confirming={confirming}
          setConfirming={setConfirming}
        />
        <AnimatePresence mode="wait">
          {!confirming && (
            <motion.div
              key="reservation-form"
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="space-y-3">
                <h2 className="text-2xl font-bold">
                  {isOwnedByUser ? "Event Details" : "Reservation Details"}
                </h2>
                <p>
                  Restaurant:{" "}
                  <b>{restaurant.name + " @ " + restaurant.address}</b>
                </p>

                <Button
                  type="button"
                  onClick={() => setShowReservation(!showReservation)}
                >
                  Select Date and Time
                </Button>

                <div
                  className={`transition-all duration-500 ease-in-out overflow-hidden ${
                    showReservation
                      ? "max-h-[1000px] opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="flex justify-center">
                    <DateInputRestaurant
                      startDate={startDate}
                      updateDate={updateDate}
                      existingItems={existingReservations}
                      restaurant={restaurant}
                      type="reservation"
                    />
                  </div>
                  <AnimatePresence mode="wait">
                    {startDate ? (
                      availableSlots.length > 0 ? (
                        <motion.div
                          key="time-slot-select"
                          initial={{ maxHeight: 0, opacity: 0 }}
                          animate={{ maxHeight: 100, opacity: 1 }}
                          exit={{ maxHeight: 0, opacity: 0 }}
                          transition={{ duration: 0.5, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="flex gap-2 items-center">
                            <label className="text-sm">Time Slot:</label>
                            <Select
                              onValueChange={updateTime}
                              value={selectedTime || ""}
                            >
                              <SelectTrigger className="w-[120px]">
                                <SelectValue placeholder="Time Slot" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableTimeSlots.map((time) => (
                                  <SelectItem
                                    key={`slot-${time}`}
                                    value={time}
                                    disabled={slotFullChecker(time)}
                                  >
                                    {time}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </motion.div>
                      ) : (
                        <LoadingSpinner inline={true} size="sm" />
                      )
                    ) : (
                      <p> Please Select Date to see Available Time Slots</p>
                    )}
                  </AnimatePresence>
                </div>

                {startDate && (
                  <p className="text-gray-700">
                    You selected:{" "}
                    <b>
                      {DateTime.fromJSDate(
                        getValues("startDate")
                      ).toLocaleString(readableTimeSettings)}
                    </b>
                  </p>
                )}

                {errors.startDate && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.startDate.message}
                  </p>
                )}

                {selectedTime && capacityForSlot !== undefined ? (
                  <motion.div
                    key="pax-select"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faUser} className="w-4 h-4" />
                      <label htmlFor="pax">Guests:</label>

                      {reservationId && watch("pax") === undefined ? (
                        <LoadingSpinner inline size="sm" />
                      ) : (
                        <Select
                          onValueChange={(val) => setValue("pax", Number(val))}
                          value={watch("pax")?.toString() || ""}
                        >
                          <SelectTrigger className="w-[100px]">
                            <SelectValue placeholder="Guests" />
                          </SelectTrigger>
                          <SelectContent>
                            {capacityForSlot === 0 ? (
                              <SelectItem disabled value="0">
                                Unavailable at that time
                              </SelectItem>
                            ) : (
                              Array.from(
                                { length: capacityForSlot },
                                (_, i) => (
                                  <SelectItem
                                    key={i + 1}
                                    value={(i + 1).toString()}
                                  >
                                    {i + 1}
                                  </SelectItem>
                                )
                              )
                            )}
                          </SelectContent>
                        </Select>
                      )}

                      {errors.pax && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.pax.message}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ) : null}
                <div className="space-y-2">
                  <FormField
                    key="remarks"
                    control={form.control}
                    name="remarks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Remarks (optional)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type={"text"}
                            placeholder="Remarks (optional)"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button
                  type="button"
                  className="w-full"
                  onClick={handleFirstSubmit}
                >
                  Verify Details
                </Button>
              </div>
            </motion.div>
          )}

          {confirming && (
            <motion.div
              key="confirmation-section"
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 100, opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <ConfirmationPage
                isSubmitting={form.formState.isSubmitting}
                formName="Reservation"
                details={{
                  "Restaurant Name": restaurant.name,
                  "Reservation Date": DateTime.fromJSDate(
                    getValues("startDate")
                  ).toLocaleString(readableTimeSettings),
                  Guests: getValues("pax"),
                  Remarks: getValues("remarks") || "-",
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </FormProvider>
  )
}

export default ReservationForm
