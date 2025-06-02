import React, { useState } from "react"
import Calendar from "@/components/common/Calendar"
import CustomDay from "@/components/common/CustomDay"

const CalendarReservations = ({ reservations, selectedDate, onSelectDate }) => {
  return (
    <div className="flex justify-center">
      <Calendar
        selected={selectedDate}
        onSelect={onSelectDate}
        components={{
          Day: (props) => (
            <CustomDay
              {...props}
              existingReservations={reservations}
              updateDate={onSelectDate}
            />
          ),
        }}
        disabled={() => false}
        className="mx-auto"
      />
    </div>
  )
}

export default CalendarReservations
