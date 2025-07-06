import { useEffect, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import TransactionCard from "@/components/common/TransactionCard"
import { getRewardsForRestaurant } from "@/services/rewardService"
import {
  getCardMessageFromDescription,
  getShortAddress,
} from "@/utils/stringRegexUtils"
import { categoryOptions, iconMap } from "@/utils/rewardUtils"
import { Button } from "@/components/ui/button"
import { toast } from "react-toastify"
import LoadingSpinner from "@/components/common/LoadingSpinner"
import { getRestaurant } from "@/services/restaurantService"
import { ownedByUser } from "@/utils/ownerCheck"
import CustomerPoints from "./CustomerPoints"
import Pagination from "../common/Pagination"

const RestaurantRewardStore = ({ user }) => {
  const { restaurantId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [isOwner, setIsOwner] = useState(false)
  const [rewards, setRewards] = useState(null)
  const [restaurant, setRestaurant] = useState(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    const fetchRewardsAndRestaurant = async () => {
      try {
        const data = await getRewardsForRestaurant(restaurantId, {
          page,
          limit: 8,
        })

        const restaurant = await getRestaurant(restaurantId)
        const ownerCheck = ownedByUser(restaurant, user)

        setIsOwner(ownerCheck)
        setRewards(data.items || [])
        setRestaurant(restaurant)
        setTotalPages(data.totalPages || 1)
        setTotalCount(data.totalCount || 0)
      } catch (ex) {
        toast.error("Failed to fetch rewards")
        setRewards([])
        throw ex
      }
    }

    fetchRewardsAndRestaurant()
  }, [restaurantId, page])

  if (!rewards) return <LoadingSpinner className="my-10" />

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6 text-center">
        Rewards @ {restaurant?.name} - {getShortAddress(restaurant?.address)}
      </h1>

      {isOwner ? (
        <div className="flex justify-center mb-4">
          <Button onClick={() => navigate(`/rewards/${restaurantId}/new`)}>
            Add Reward
          </Button>
        </div>
      ) : user?.role === "customer" ? (
        <CustomerPoints customer={user} restaurant={restaurant} />
      ) : (
        <p className="text-muted-foreground text-center">
          Please Login to see your Points
        </p>
      )}

      {rewards.length === 0 ? (
        <p className="text-muted-foreground text-center">
          No rewards available
        </p>
      ) : (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {rewards.map((reward) => {
              const { icon: Icon, colour } = iconMap[reward.category] || {}
              const categoryLabel =
                categoryOptions.find((opt) => opt.value === reward.category)
                  ?.label || reward.category

              return (
                <TransactionCard
                  key={reward._id}
                  _id={reward._id}
                  name={`${categoryLabel} Reward`}
                  price={reward.pointsRequired}
                  currencyType="points"
                  iconComponent={
                    Icon ? <Icon className={`w-20 h-20 ${colour}`} /> : null
                  }
                  description={getCardMessageFromDescription(
                    reward.description
                  )}
                  clickMessage="Find out more"
                  onClick={() =>
                    navigate(`/rewards/${reward._id}`, {
                      state: {
                        from: location.pathname,
                      },
                    })
                  }
                />
              )
            })}
          </div>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalCount={totalCount}
            onPageChange={(p) => setPage(p)}
          />
        </div>
      )}
    </div>
  )
}

export default RestaurantRewardStore
