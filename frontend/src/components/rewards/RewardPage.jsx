import { useEffect, useState } from "react"
import { useParams, useNavigate, useLocation } from "react-router-dom"
import { toast } from "react-toastify"
import BackButton from "@/components/common/BackButton"
import LoadingSpinner from "@/components/common/LoadingSpinner"
import { useConfirm } from "@/components/common/ConfirmProvider"
import {
  getRewardById,
  deleteReward,
  redeemRewardItem,
} from "@/services/rewardService"
import { categoryOptions, iconMap } from "@/utils/rewardUtils"
import { ownedByUserWithId } from "@/utils/ownerCheck"
import { getRestaurant } from "@/services/restaurantService"
import { getCustomerPointsForRestaurant } from "@/services/rewardService"
import RestaurantRelatedItemUI from "../common/RestaurantRelatedUI"
import { DollarSign } from "lucide-react"

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
    <RestaurantRelatedItemUI
      type="Reward"
      item={reward}
      bgColour={bgColour}
      restaurant={restaurant}
      from={normalisedFrom}
      title={`${
        categoryOptions.find((opt) => opt.value === category)?.label || category
      } Reward`}
      icon={<Icon className={`w-16 h-16 ${colour}`} />}
      categoryLabel={category}
      description={description}
      metaContent={
        <>
          <p>
            Redeemable for <strong>{pointsRequired} points</strong>
          </p>
          {stock != null && (
            <p>
              Stock available: <strong>{stock}</strong>
            </p>
          )}
          {!isActive && <p className="text-red-500">Inactive reward</p>}
        </>
      }
      isOwnedByUser={isOwnedByUser}
      onEdit={() =>
        navigate(`/rewards/${restaurant._id}/edit/${_id}`, {
          state: { from: location.pathname },
        })
      }
      onDelete={handleDeleteReward}
      onClick={
        user?.role === "customer"
          ? {
              onClick: handleRedeemReward,
              icon: <DollarSign className="w-5 h-5" />,
              label: `Redeem for ${pointsRequired} points`,
            }
          : null
      }
    />
  )
}

export default RewardPage
