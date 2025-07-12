import React, { useEffect, useState } from "react"
import Calendar from "@/components/common/Calendar"
import CustomDay from "@/components/common/CustomDay"
import { getReservations } from "@/services/reservationService"
import LoadingSpinner from "../common/LoadingSpinner"

const CalendarReservations = ({ selectedDate, onSelectDate }) => {
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const response = await getReservations({ page: 1, limit: 8 })
        setReservations(response.reservations || [])
      } finally {
        setLoading(false)
      }
    }

    fetchReservations()
  }, [])

  if (loading) return <LoadingSpinner size="md" />

  return (
    <div className="flex flex-col items-center space-y-2">
      <Calendar
        selected={selectedDate}
        onSelect={onSelectDate}
        components={{
          Day: (props) => (
            <CustomDay
              {...props}
              existingItems={reservations}
              updateDate={onSelectDate}
              type="Booking"
            />
          ),
        }}
        disabled={() => false}
        className="mx-auto"
      />
      <p className="text-sm text-muted-foreground">
        Showing the 8 most recent bookings
      </p>
    </div>
  )
}

export default CalendarReservations
