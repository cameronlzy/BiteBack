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
  const [itemsWithNames, setItemsWithNames] = useState([])
  const isDisabled = modifiers?.disabled

  const dateStr = format(date, "yyyy-MM-dd")
  const itemsOnDate = (existingItems ?? []).filter(
    (item) => format(parseISO(item.startDate), "yyyy-MM-dd") === dateStr
  )
  const hasItems = itemsOnDate.length > 0

  useEffect(() => {
    const enrichWithRestaurantNames = async () => {
      if (type === "Promotion") {
        setItemsWithNames(itemsOnDate)
        return
      }

      const enriched = await Promise.all(
        itemsOnDate.map(async (item) => {
          if (typeof item.restaurant === "string") {
            try {
              const res = await getRestaurant(item.restaurant)
              return {
                ...item,
                restaurant: res ? { name: res.name } : { name: "Unknown" },
              }
            } catch {
              return { ...item, restaurant: { name: "Unknown" } }
            }
          }
          return item
        })
      )

      setItemsWithNames(enriched)
    }

    if (hasItems) {
      enrichWithRestaurantNames()
    }
  }, [itemsOnDate, type, hasItems])

  const handleClick = () => updateDate(date)

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
          : isSelected && hasItems
          ? "bg-yellow-300 hover:bg-yellow-400"
          : isSelected
          ? "bg-gray-200 hover:bg-gray-300"
          : hasItems
          ? "bg-yellow-100 hover:bg-yellow-200"
          : ""
      }`}
    >
      {date.getDate()}
    </Button>
  )

  return hasItems && !isDisabled ? (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent className="text-sm text-black bg-white w-max z-50 border shadow-md">
        <div className="font-semibold text-center mb-1">
          {type === "Booking" ? "Your Current Bookings" : `Scheduled ${type}s`}
        </div>
        {itemsWithNames.map((item, i) => {
          const startTime = format(parseISO(item.startDate), "HH:mm")
          const restName = item.restaurant?.name

          return (
            <div key={i}>
              {type === "Booking" ? (
                <>
                  {startTime} · {item.pax} pax
                  {restName && ` @ ${restName}`}
                </>
              ) : (
                <>
                  {startTime} · {item.title}
                  {restName && ` @ ${restName}`}
                </>
              )}
            </div>
          )
        })}
      </TooltipContent>
    </Tooltip>
  ) : (
    button
  )
}

export default CustomDay
