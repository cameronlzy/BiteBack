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
  getCustomerPointsForRestaurant,
  saveReward,
} from "@/services/rewardService"
import { getRestaurant } from "@/services/restaurantService"
import { categoryOptions, iconMap } from "@/utils/rewardUtils"
import { ownedByUserWithId } from "@/utils/ownerCheck"
import RestaurantRelatedItemUI from "../common/RestaurantRelatedItemUI"
import { AlertTriangle, DollarSign } from "lucide-react"
import RewardRestock from "./RewardRestock"

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
  const from = location.state?.from || "/restaurants"

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
    const isOwnedByUserCheck = ownedByUserWithId(reward?.restaurant, user)
    setIsOwnedByUser(isOwnedByUserCheck)
  }, [reward, user])

  const handleToggleActivate = async () => {
    try {
      const updated = await saveReward(restaurant?._id, {
        _id: reward._id,
        isActive: !reward.isActive,
      })
      toast.success(
        `Reward made ${updated.isActive ? "Available" : "Unavailable"}`
      )
      setReward((prev) => ({
        ...prev,
        ...updated,
        restaurant: prev?.restaurant,
      }))
    } catch (ex) {
      toast.error("Failed to toggle promotion status")
      throw ex
    }
  }

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
      await redeemRewardItem({ rewardItem: reward._id })
      toast.success("Reward redeemed successfully")
      navigate("/my-rewards", {
        replace: true,
        state: {
          from: location.pathname,
        },
      })
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
          <BackButton from={from} />
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
      from={from}
      title={`${
        categoryOptions.find((opt) => opt.value === category)?.label || category
      } Reward`}
      icon={<Icon className={`w-16 h-16 ${colour}`} />}
      categoryLabel={category}
      description={description}
      onActivate={handleToggleActivate}
      currentlyActive={isActive}
      activatePhrase="Make Available"
      deactivatePhrase="Mark as Unavailable"
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
          {isOwnedByUser && reward.stock && (
            <RewardRestock
              reward={reward}
              restaurantId={restaurant._id}
              setReward={setReward}
            />
          )}
        </>
      }
      isOwnedByUser={isOwnedByUser}
      onEdit={() =>
        navigate(`/rewards/${restaurant._id}/edit/${_id}`, {
          state: { from: location.pathname },
        })
      }
      onDelete={handleDeleteReward}
      action={
        user?.role === "customer" && isActive
          ? {
              onClick: handleRedeemReward,
              icon: <DollarSign className="w-5 h-5" />,
              label: `Redeem for ${pointsRequired} points`,
            }
          : null
      }
      banner={
        !isActive ? (
          <div className="bg-gray-100 text-gray-800 border-t-4 border-gray-400 px-4 py-3 flex items-center justify-between rounded-t-md">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">
                This reward is temporarily unavailable
              </span>
            </div>
          </div>
        ) : null
      }
    />
  )
}

export default RewardPage
