import React from "react"
import { DayPicker } from "react-day-picker"
import "react-day-picker/dist/style.css"

const Calendar = ({ selected, onSelect, components, disabled }) => {
  return (
    <DayPicker
      mode="single"
      selected={selected}
      onSelect={onSelect}
      components={components}
      disabled={disabled}
      className={"rounded-md border shadow p-4"}
    />
  )
}

export default Calendar
