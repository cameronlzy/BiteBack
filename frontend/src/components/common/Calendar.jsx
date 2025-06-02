import React from "react"
import { DayPicker } from "react-day-picker"
import "react-day-picker/dist/style.css"

const Calendar = ({ selected, onSelect, components, disabled, className }) => {
  return (
    <DayPicker
      mode="single"
      selected={selected}
      onSelect={onSelect}
      components={components}
      disabled={disabled}
      className={"rounded-md border shadow p-4"}
      // styles={{
      //   caption: { marginBottom: "0.5rem" },
      //   table: { marginBottom: 0 },
      //   months: { marginBottom: 0 },
      // }}
    />
  )
}

export default Calendar
