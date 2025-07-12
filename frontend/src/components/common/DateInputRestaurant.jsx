import { getDay } from "date-fns"
import Calendar from "./Calendar"
import CustomDay from "./CustomDay"

const DateInputRestaurant = ({
  startDate,
  updateDate,
  existingItems,
  restaurant,
}) => {
  return (
    <Calendar
      selected={startDate}
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
            restaurant.openingHours?.[weekday]?.toLowerCase() === "closed"
          const isPastDate =
            props.date.setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0)

          return (
            <CustomDay
              {...props}
              updateDate={updateDate}
              existingItems={existingItems}
              type="Reservations"
              selected={startDate}
              modifiers={{ disabled: isDisabled || isPastDate }}
            />
          )
        },
      }}
    />
  )
}

export default DateInputRestaurant
