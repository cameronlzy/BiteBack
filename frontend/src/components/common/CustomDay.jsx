import { format, parseISO } from "date-fns"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { getRestaurant } from "@/services/restaurantService"

const CustomDay = ({
  date,
  selected,
  existingItems,
  type = "Reservations",
  updateDate,
  modifiers,
}) => {
  const [restaurantMap, setRestaurantMap] = useState({})
  const isDisabled = modifiers?.disabled

  const getReservationsForDate = (date) => {
    const dateStr = format(date, "yyyy-MM-dd")
    return (existingItems ?? []).filter(
      (res) => format(parseISO(res.startDate), "yyyy-MM-dd") === dateStr
    )
  }

  const reservationsOnDate = getReservationsForDate(date)
  const hasReservations = reservationsOnDate.length > 0

  useEffect(() => {
    const fetchRestaurants = async () => {
      const missingIds = reservationsOnDate
        .map((res) => res.restaurant)
        .filter((id) => !restaurantMap[id])

      const results = await Promise.all(
        missingIds.map((id) => getRestaurant(id).catch(() => null))
      )

      const newMap = {}
      results.forEach((res, i) => {
        const id = missingIds[i]
        if (res?.name) newMap[id] = res.name
      })

      if (Object.keys(newMap).length > 0) {
        setRestaurantMap((prev) => ({ ...prev, ...newMap }))
      }
    }

    if (hasReservations) {
      fetchRestaurants()
    }
  }, [reservationsOnDate, hasReservations, restaurantMap])

  const handleClick = () => {
    updateDate(date)
  }

  const isSelected =
    selected && format(date, "yyyy-MM-dd") === format(selected, "yyyy-MM-dd")

  const button = (
    <Button
      variant="ghost"
      size="icon"
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      className={`rounded-full w-8 h-8 p-0 text-[13px] ${
        isDisabled
          ? "text-gray-400 cursor-not-allowed"
          : isSelected && hasReservations
          ? "bg-yellow-300 hover:bg-yellow-400"
          : isSelected
          ? "bg-gray-200 hover:bg-gray-300"
          : hasReservations
          ? "bg-yellow-100 hover:bg-yellow-200"
          : ""
      }`}
    >
      {date.getDate()}
    </Button>
  )

  return hasReservations && !isDisabled ? (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent className="text-sm text-black bg-white w-max z-50 border shadow-md">
        <div className="font-semibold text-center">
          {type === "Booking" ? "Your Current Bookings" : `Current ${type}`}
        </div>
        {reservationsOnDate.map((res, i) => (
          <div key={i}>
            {format(parseISO(res.startDate), "HH:mm")} · {res.pax} pax
            {restaurantMap[res.restaurant] &&
              ` @ ${restaurantMap[res.restaurant]}`}
          </div>
        ))}
      </TooltipContent>
    </Tooltip>
  ) : (
    button
  )
}

export default CustomDay
