import React, { useEffect, useState } from "react"
import { Card, CardTitle } from "@/components/ui/card"
import { DateTime } from "luxon"
import { Link, useLocation } from "react-router-dom"
import defaultRestImg from "@/assets/default-restaurant-img.png"
import DisabledBlur from "../common/DisabledBlur"
import { activeCheck } from "@/utils/eventUtils"
import { getRestaurant } from "@/services/restaurantService"

const EventCard = ({
  _id,
  title,
  description,
  startDate,
  endDate,
  bannerImage,
  restaurant,
  status,
}) => {
  const location = useLocation()
  const isActive = activeCheck(status)
  const imageSrc = bannerImage || defaultRestImg

  const [fullRestaurant, setFullRestaurant] = useState(
    typeof restaurant === "object" ? restaurant : null
  )

  useEffect(() => {
    const fetchRestaurant = async () => {
      if (typeof restaurant === "string") {
        try {
          const res = await getRestaurant(restaurant)
          setFullRestaurant(res)
        } catch {
          console.error("Failed to fetch restaurant info")
        }
      }
    }
    fetchRestaurant()
  }, [restaurant])

  return (
    <Card className="w-full p-4 rounded-xl shadow-md">
      <DisabledBlur
        component={imageSrc}
        isImage={true}
        disabled={!isActive}
        disabledMessage="Event is currently cancelled"
      />

      <div className="text-left space-y-2 w-full mt-2">
        <CardTitle className="text-2xl font-semibold">
          {isActive ? (
            <Link
              to={`/events/${_id}`}
              state={{ from: location.pathname }}
              className="text-black hover:text-gray-700 hover:underline transition-colors"
            >
              {title}
              {fullRestaurant ? ` by ${fullRestaurant.name}` : ""}
            </Link>
          ) : (
            <span className="text-gray-500">
              {title}
              {fullRestaurant ? ` by ${fullRestaurant.name}` : ""}
            </span>
          )}
        </CardTitle>

        <div className="text-sm text-gray-600 space-y-1">
          <p className="line-clamp-2">{description}</p>
          <p>
            <strong>Date:</strong>{" "}
            {DateTime.fromISO(startDate).toLocaleString(DateTime.DATE_MED)}{" "}
            {DateTime.fromISO(startDate).toFormat("hh:mm a")} <strong>-</strong>{" "}
            {DateTime.fromISO(endDate).toFormat("hh:mm a")}
          </p>
        </div>
      </div>
    </Card>
  )
}

export default EventCard
