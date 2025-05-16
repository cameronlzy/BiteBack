import React from "react"
import { DayPicker } from "react-day-picker"
import "react-day-picker/dist/style.css"

const Calendar = ({ selected, onSelect }) => {
  return (
    <DayPicker
      mode="single"
      selected={selected}
      onSelect={onSelect}
      className="rounded-md border shadow p-4"
    />
  )
}

export default Calendar
