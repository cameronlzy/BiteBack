import { useState } from "react"
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
import { Button } from "./ui/button"
import FormTemplate from "./common/FormWithoutCard"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

const reservationSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  phone: z
    .string()
    .optional()
    .refine((val) => !val || /^\d{8}$/.test(val), {
      message: "Phone number must be 8 digits.",
    }),
})

const ReservationPage = ({ onChange, restaurant, onSubmit }) => {
  const [showReservation, setShowReservation] = useState(false)
  const [numberOfGuests, setNumberOfGuests] = useState(1)
  const [reservationDateTime, setReservationDateTime] = useState(null)

  const updateDate = (date) => {
    if (!date) return
    const newDate = new Date(date)

    if (reservationDateTime) {
      // Preserve existing time
      newDate.setHours(reservationDateTime.getHours())
      newDate.setMinutes(reservationDateTime.getMinutes())
    }

    setReservationDateTime(newDate)
    onChange(newDate)
  }

  const form = useForm({
    resolver: zodResolver(reservationSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      numGuests: 1,
      date: "",
      time: "",
    },
  })

  const updateTime = (part, value) => {
    if (!reservationDateTime) return

    const updated = new Date(reservationDateTime)
    if (part === "hour") updated.setHours(Number(value))
    if (part === "minute") updated.setMinutes(Number(value))

    setReservationDateTime(updated)
    onChange(updated)
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Reservation Details</h2>
      <p className="mb-4">
        Restaurant: <b>{restaurant.name + "@" + restaurant.address}</b>
      </p>
      <Button onClick={() => setShowReservation(!showReservation)}>
        Select Date and Time
      </Button>
      <div
        className={`transition-all duration-500 ease-in-out overflow-hidden ${
          showReservation ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="flex justify-center">
          <Calendar
            selected={reservationDateTime}
            onSelect={updateDate}
            mode="single"
          />
        </div>
        <div className="mt-4 flex items-center justify-center gap-2">
          <label
            htmlFor="time"
            className="block text-m font-medium text-gray-700"
          >
            Select Time:
          </label>
          <div className="flex gap-4">
            <Select onValueChange={(val) => updateTime("hour", val)}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Hour" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 24 }, (_, i) => {
                  const hour = String(i).padStart(2, "0")
                  return (
                    <SelectItem key={hour} value={hour}>
                      {hour}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
            <Select onValueChange={(val) => updateTime("minute", val)}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Minute" />
              </SelectTrigger>
              <SelectContent>
                {["00", "15", "30", "45"].map((min) => (
                  <SelectItem key={min} value={min}>
                    {min}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      {reservationDateTime && (
        <p className="mt-4 text-gray-700">
          You selected:{" "}
          <b>
            {reservationDateTime.toLocaleDateString() +
              " " +
              reservationDateTime.getHours().toString().padStart(2, "0") +
              ":" +
              reservationDateTime.getMinutes().toString().padStart(2, "0")}
          </b>
        </p>
      )}
      <p className="mt-4 text-gray-700 flex items-center text-m justify-center gap-2">
        <FontAwesomeIcon icon={faUser} className="w-4 h-4 mr-1" />
        Number of Guests:{" "}
        <Select onValueChange={setNumberOfGuests} className="center">
          <SelectTrigger className="w-[100px]">
            <SelectValue placeholder="Guests" />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 10 }, (_, i) => (
              <SelectItem key={i + 1} value={i + 1}>
                {i + 1}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </p>
      <FormTemplate
        title="Details"
        description="Please fill in the details below"
        buttonText="Submit"
        onSubmit={onSubmit}
        form={form}
        inputFields={[
          { name: "name", label: "Name", placeholder: "your name" },
          { name: "email", label: "Email", placeholder: "your email" },
          { name: "phone", label: "Phone", placeholder: "your phone" },
        ]}
      />
    </div>
  )
}

export default ReservationPage
