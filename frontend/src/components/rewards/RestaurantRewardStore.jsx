import TransactionCard from "@/components/common/TransactionCard"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { useEffect, useState } from "react"
import {
  TicketPercent,
  CircleDollarSign,
  Gift,
  ShoppingBag,
} from "lucide-react"
import {
  getCardMessageFromDescription,
  getShortAddress,
} from "@/utils/stringRegexUtils"

const restaurant = {
  name: "Luigi's",
  address: "Orchard Boulevard, Singapore 230540",
}

const dummyRewards = [
  {
    _id: "1",
    name: "10% Off Entire Bill",
    price: 500,
    type: "percentage",
    date: "Ends 31 July 2025",
    description:
      "Valid for dine-in orders only. Not stackable with other discounts.",
  },
  {
    _id: "2",
    name: "$5 Off Voucher",
    price: 300,
    type: "fixed",
    date: "Starts 5 July 2025",
    description: "Min. spend $20 required. Valid across all outlets.",
  },
  {
    _id: "3",
    name: "Free Dessert",
    price: 250,
    type: "freeItem",
    date: "Ends 15 Aug 2025",
    description: "While stocks last. One redemption per visit.",
  },
  {
    _id: "4",
    name: "Buy 2 Get 3 Sushi Plates",
    price: 600,
    type: "buyXgetY",
    date: "Ends 31 July 2025",
    description: "Valid on weekdays only. Limited to dine-in orders.",
  },
]

const iconMap = {
  percentage: { icon: TicketPercent, colour: "text-rose-500" },
  fixed: { icon: CircleDollarSign, colour: "text-yellow-600" },
  freeItem: { icon: Gift, colour: "text-green-600" },
  buyXgetY: { icon: ShoppingBag, colour: "text-blue-500" },
}

const RestaurantRewardStore = () => {
  const { restaurantId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [rewards, setRewards] = useState(null)
  // const [restaurant, setRestaurant] = useState({})

  useEffect(() => {
    const fetchRewards = async () => {
      try {
        const { rewards } = await getAllRewardsByRestaurant(restaurantId)
        setRewards(rewards)
      } catch (ex) {
        setRewards([])
      }
    }
    fetchRewards()
  }, [restaurantId])

  // if (!rewards) return <LoadingSpinner className="my-10" />

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6 text-center">
        Rewards @ {restaurant.name} - {getShortAddress(restaurant.address)}
      </h1>
      {dummyRewards.length === 0 ? (
        <p className="text-muted-foreground text-center">
          No rewards available.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {dummyRewards.map((reward) => {
            const { icon: Icon, colour } = iconMap[reward.type] || {}
            return (
              <TransactionCard
                key={reward._id}
                _id={reward._id}
                name={reward.name}
                price={reward.price}
                currencyType="points"
                iconComponent={<Icon className={`w-20 h-20 ${colour}`} />}
                cardMessage={getCardMessageFromDescription(reward.description)}
                clickMessage="Find out more"
                onClick={() =>
                  navigate(`/reward/${reward._id}`, {
                    state: {
                      from: location.pathname,
                    },
                  })
                }
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

export default RestaurantRewardStore
