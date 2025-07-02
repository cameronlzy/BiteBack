import { useEffect, useState } from "react"
import { Calendar } from "@/components/ui/calendar"
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
import { getDay } from "date-fns"
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
import CustomDay from "../common/CustomDay"
import LoadingSpinner from "../common/LoadingSpinner"
import { objectComparator } from "@/utils/objectComparator"

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
      reservationDate: undefined,
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
      const reservations = await getReservations()
      setExistingReservations(reservations)
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

  const isOwnedByUser = user?.role === "owner" && restaurant?.owner === user._id

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

        if (String(reservation?.user) !== String(user._id)) {
          toast.error("You are not authorised to view this reservation", {
            toastId: "unauthorised-reservation",
          })
          navigate(`/reservation/${restaurantId}`, { replace: true })
          return
        }

        const newReservationDate = DateTime.fromISO(
          reservation.reservationDate,
          {
            zone: "Asia/Singapore",
          }
        ).toJSDate()
        setPreloadedReservationDate(newReservationDate)
        setPreloadedTimeSlot(
          DateTime.fromJSDate(newReservationDate).toFormat("HH:mm")
        )
        setPreloadedPax(reservation.pax)

        setValue("reservationDate", newReservationDate)
        setTimeout(() => {
          updateTime(DateTime.fromJSDate(newReservationDate).toFormat("HH:mm"))
          setValue("pax", reservation.pax)
        }, 100)
      } catch (ex) {
        if (ex.response?.status === 404) {
          navigate("/not-found", { replace: true })
        }
      }
    }

    preloadReservation()
  }, [reservationId, restaurant])

  const reservationDate = watch("reservationDate")

  useEffect(() => {
    if (!reservationDate || !restaurant) return

    const fetchAvailability = async () => {
      const formatted =
        DateTime.fromJSDate(reservationDate).toFormat("yyyy-MM-dd")

      //       const formatted = DateTime.fromJSDate(reservationDate)
      // .setZone("Asia/Singapore")
      // .startOf("day")
      // .toISO()
      let slots = await getRestaurantAvailability(restaurantId, formatted)
      if (slots === -1) slots = []

      const selectedDateStr =
        DateTime.fromJSDate(reservationDate).toFormat("yyyy-MM-dd")
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
  }, [reservationDate, restaurant])

  if (!restaurant) return <LoadingSpinner />

  const handleDateTimeChange = (date) => {
    if (date) {
      setValue("reservationDate", date)
    }
  }

  const updateDate = (date) => {
    if (!date) return
    const newDate = new Date(date)

    if (reservationDate) {
      newDate.setHours(reservationDate.getHours())
      newDate.setMinutes(reservationDate.getMinutes())
    }

    setValue("reservationDate", newDate)
    handleDateTimeChange(newDate)
  }

  const updateTime = (time) => {
    if (!reservationDate || !time) return

    const sgtTime = DateTime.fromFormat(time, "HH:mm", { zone: "utc" })

    const updated = DateTime.fromJSDate(reservationDate)
      .set({
        hour: sgtTime.hour,
        minute: sgtTime.minute,
        second: 0,
        millisecond: 0,
      })
      .toJSDate()

    setValue("reservationDate", updated)
    handleDateTimeChange(updated)
  }

  const handleFirstSubmit = async () => {
    // Take userId from the user object in the localStorage
    setValue("userId", String(user._id))
    // Use the ID in the URL
    setValue("restaurantId", String(restaurant._id))
    const valid = await trigger()
    if (valid) setConfirming(true)
  }

  const onSubmit = async (data) => {
    try {
      const finalReservation = {
        restaurant: data.restaurantId,
        pax: data.pax,
        reservationDate: DateTime.fromJSDate(data.reservationDate)
          .setZone("Asia/Singapore")
          .toISO(),
        user: user._id,
        remarks: data.remarks || "",
      }
      const originalReservation = existingReservations.find(
        (r) => r._id === reservationId
      )
      const result = objectComparator(originalReservation, finalReservation)
      if (reservationId && Object.keys(result).length === 0) {
        navigate(from, {
          replace: true,
        })
      }
      result._id = reservationId
      reservationId
        ? await saveReservation(result, true)
        : await saveReservation(finalReservation, false)
      toast.success("Reserved successfully!")
      navigate(from, {
        replace: true,
      })
    } catch (ex) {
      if (ex.response && ex.response.status === 400) {
        const message = ex.response.data.error
        form.setError("reservationDate", {
          type: "manual",
          message: message || "Reservation failed",
        })
        toast.error("Reservation failed: " + message)
      } else if (ex.response && ex.response.status === 403) {
        toast.error("Not Authorised to make Reservation")
      }
    }
  }

  const selectedTime = reservationDate
    ? DateTime.fromJSDate(reservationDate).toFormat("HH:mm")
    : null
  const capacityForSlot = availableSlots.find(
    (s) => s.time === selectedTime
  )?.available

  const availableTimeSlots = availableSlots.map((s) => s.time)

  const slotFullChecker = (time) => {
    const slot = availableSlots.find((s) => s.time === time)
    const isFull = !slot || slot.available === 0
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
                    <Calendar
                      selected={reservationDate}
                      components={{
                        Day: (props) => {
                          const weekday = [
                            "sunday",
                            "monday",
                            "tuesday",
                            "wednesday",
                            "thursday",
                            "friday",
                            "saturday",
                          ][getDay(props.date)]

                          const isDisabled =
                            restaurant.openingHours?.[
                              weekday
                            ]?.toLowerCase() === "closed"
                          const isPastDate =
                            props.date.setHours(0, 0, 0, 0) <
                            new Date().setHours(0, 0, 0, 0)

                          return (
                            <CustomDay
                              {...props}
                              updateDate={updateDate}
                              existingReservations={existingReservations}
                              selected={reservationDate}
                              modifiers={{ disabled: isDisabled || isPastDate }}
                            />
                          )
                        },
                      }}
                    />
                  </div>
                  <AnimatePresence mode="wait">
                    {reservationDate ? (
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

                {reservationDate && (
                  <p className="text-gray-700">
                    You selected:{" "}
                    <b>
                      {DateTime.fromJSDate(
                        getValues("reservationDate")
                      ).toLocaleString(readableTimeSettings)}
                    </b>
                  </p>
                )}

                {errors.reservationDate && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.reservationDate.message}
                  </p>
                )}

                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faUser} className="w-4 h-4" />
                  <label htmlFor="pax">Guests:</label>
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
                        Array.from({ length: capacityForSlot }, (_, i) => (
                          <SelectItem key={i + 1} value={(i + 1).toString()}>
                            {i + 1}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {errors.pax && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.pax.message}
                    </p>
                  )}
                </div>
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
                    getValues("reservationDate")
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
