import { ownedByUserWithId } from "@/utils/ownerCheck"
import { DateTime } from "luxon"
import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import TransactionCard from "../common/TransactionCard"
import { getRestaurant } from "@/services/restaurantService"

const RestaurantEvents = () => {
  const [events, setEvents] = useState([])
  const [restaurant, setRestaurant] = useState(null)
  const { restaurantId } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchEventAndRestaurant = async () => {
      try {
        const restaurant = getRestaurant(restaurantId)
        setRestaurant(restaurant)
        const events = []
        // const events = getRestaurantEvents(restaurantId)
        setEvents(events)
      } catch (ex) {
        if (ex.response?.status === 404) {
          toast.error("Restaurant Not Found")
          navigate("/not-found", { replace: true })
        }
      }
    }
  }, [restaurantId])

  return events.map((e) => {
    const expiry = DateTime.fromISO(e.startDateTime).plus(e.duration).toISO()

    return (
      <TransactionCard
        key={e._id}
        _id={e._id}
        name={`${e.title || "Event"} @ ${restaurant.name}`}
        price={e?.price > 0 ? e.price : null}
        currencyType="money"
        rewardCode={isActivated ? reward.code : null}
        description={
          !isActivated
            ? getCardMessageFromDescription(snapshot.description)
            : null
        }
        expiry={expiry}
        image={e.mainImage}
      />
    )
  })
}

export default RestaurantEvents
