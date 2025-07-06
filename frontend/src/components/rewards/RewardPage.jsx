import { useEffect, useState } from "react"
import { useParams, useNavigate, useLocation, Link } from "react-router-dom"
import { toast } from "react-toastify"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import {
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu"
import { Settings, ArrowRight, DollarSign } from "lucide-react"
import BackButton from "@/components/common/BackButton"
import LoadingSpinner from "@/components/common/LoadingSpinner"
import { useConfirm } from "@/components/common/ConfirmProvider"
import {
  getRewardById,
  deleteReward,
  redeemRewardItem,
} from "@/services/rewardService"
import { iconMap } from "@/utils/rewardUtils"
import { ownedByUserWithId } from "@/utils/ownerCheck"
import { getRestaurant } from "@/services/restaurantService"
import { getCustomerPointsForRestaurant } from "@/services/rewardService"

const RewardPage = ({ user }) => {
  const [reward, setReward] = useState(null)
  const [restaurant, setRestaurant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isOwnedByUser, setIsOwnedByUser] = useState(false)
  const [points, setPoints] = useState(0)
  const confirm = useConfirm()
  const { rewardId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [normalisedFrom, setNormalisedFrom] = useState(
    location.state?.from || "/restaurants"
  )

  useEffect(() => {
    const fetchRewardAndRestaurant = async () => {
      try {
        const reward = await getRewardById(rewardId)
        const restaurant = await getRestaurant(reward?.restaurant)
        setReward(reward)
        setRestaurant(restaurant)

        if (user?.role === "customer") {
          const data = await getCustomerPointsForRestaurant(restaurant._id)
          console.log(data)
          setPoints(data?.points || 0)
        }
      } catch (ex) {
        if (ex.response?.status === 404 || ex.response?.status === 400) {
          toast.error("Reward not found")
          navigate("/not-found")
          return
        }
        throw ex
      } finally {
        setLoading(false)
      }
    }
    fetchRewardAndRestaurant()
  }, [rewardId, user])

  useEffect(() => {
    if (normalisedFrom.startsWith("/restaurants/") && reward?.restaurant) {
      const segments = normalisedFrom.split("/")
      const maybeRestaurantId = segments[2]
      if (maybeRestaurantId === reward?.restaurant) {
        setNormalisedFrom("/current-rewards/" + reward.restaurant)
      }
    }
    const isOwnedByUserCheck = ownedByUserWithId(reward?.restaurant, user)
    setIsOwnedByUser(isOwnedByUserCheck)
  }, [reward, normalisedFrom, user])

  const handleDeleteReward = async () => {
    const confirmed = await confirm(
      `Are you sure you want to delete the reward "${reward?.description}"?`
    )
    if (confirmed) {
      try {
        await deleteReward(reward.restaurant, reward._id)
        toast.success("Reward deleted")
        navigate(`/current-rewards/${reward.restaurant}`, { replace: true })
      } catch (ex) {
        toast.error("Failed to delete reward")
        throw ex
      }
    }
  }

  const handleRedeemReward = async () => {
    if (points < reward.pointsRequired) {
      const shortfall = reward.pointsRequired - points
      toast.info(`You are ${shortfall} points short to redeem this reward.`)
      return
    }

    const confirmed = await confirm(
      `Are you sure you want to use ${reward.pointsRequired} points to redeem this reward?`
    )
    if (!confirmed) return

    try {
      console.log(reward)
      await redeemRewardItem({ rewardItem: reward._id })
      toast.success("Reward redeemed successfully")
      navigate("/my-rewards", { replace: true })
    } catch (ex) {
      toast.error("Failed to redeem reward")
      throw ex
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center mt-20">
        <LoadingSpinner />
      </div>
    )
  }

  if (!reward) {
    return (
      <div className="text-center text-lg text-gray-500 mt-10">
        <div className="mt-4">
          <BackButton from={normalisedFrom} />
        </div>
        Reward not found.
      </div>
    )
  }

  const { _id, category, description, pointsRequired, stock, isActive } = reward

  const backup = {
    colour: "text-gray-500",
    bgColour: "bg-gray-100",
  }

  const { icon: Icon, colour, bgColour } = iconMap[category] ?? backup

  return (
    <div className="max-w-3xl mx-auto mt-8 px-4 relative">
      <BackButton from={normalisedFrom} />

      <Card className="mt-4 shadow-xl border relative">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <CardTitle className="text-2xl font-bold">
            {category.charAt(0).toUpperCase() + category.slice(1)} Reward
          </CardTitle>
          <Link
            to={`/restaurants/${restaurant._id}`}
            state={{ from: location.pathname }}
          >
            <Button variant="outline" size="sm">
              To {restaurant.name || "Restaurant"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative flex items-center justify-center p-6">
            <div className={`${bgColour} rounded-full p-6 border`}>
              <Icon className={`w-16 h-16 ${colour}`} />
            </div>

            {isOwnedByUser && (
              <div className="absolute top-2 right-2 z-10">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-700 hover:bg-gray-100"
                    >
                      <Settings className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    align="end"
                    className="w-40 bg-white shadow-md rounded-md"
                  >
                    <DropdownMenuItem
                      className="hover:bg-gray-100 text-gray-800"
                      onClick={() =>
                        navigate(`/rewards/${restaurant._id}/edit/${_id}`, {
                          state: { from: location.pathname },
                        })
                      }
                    >
                      Edit Reward
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleDeleteReward}
                      className="text-red-600 hover:bg-red-50 focus:bg-red-100 focus:text-red-700 font-medium"
                    >
                      Delete Reward
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

          <p className="text-gray-700 text-base font-semibold whitespace-pre-line">
            {description}
          </p>

          <div className="text-sm text-gray-600 space-y-1">
            {user?.role !== "customer" && (
              <p>
                Redeemable for <strong>{pointsRequired} points</strong>
              </p>
            )}
            {stock != null && (
              <p>
                Stock available: <strong>{stock}</strong>
              </p>
            )}
            {!isActive && <p className="text-red-500">Inactive reward</p>}
          </div>

          {user?.role === "customer" && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={handleRedeemReward}
            >
              <DollarSign className="w-5 h-5 mr-2" />
              Redeem Reward for{" "}
              <strong className="ml-1">{pointsRequired} points</strong>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default RewardPage
