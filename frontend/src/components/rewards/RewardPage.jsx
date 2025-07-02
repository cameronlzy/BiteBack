import { useEffect, useState } from "react"
import { useParams, useNavigate, useLocation, Link } from "react-router-dom"
import { DateTime } from "luxon"
import { toast } from "react-toastify"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import {
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu"
import {
  Settings,
  ArrowRight,
  Gift,
  ShoppingBag,
  CircleDollarSign,
  TicketPercent,
  DollarSign,
} from "lucide-react"
import BackButton from "@/components/common/BackButton"
import LoadingSpinner from "@/components/common/LoadingSpinner"
import { useConfirm } from "@/components/common/ConfirmProvider"
import {
  getRewardById,
  deleteReward,
  saveReward,
} from "@/services/rewardService"
import { readableTimeSettings } from "@/utils/timeConverter"
import { redeemRewardItem } from "@/services/rewardService"

const iconMap = {
  percentage: {
    icon: TicketPercent,
    colour: "text-rose-500",
    bgColour: "bg-rose-100",
  },
  fixed: {
    icon: CircleDollarSign,
    colour: "text-yellow-600",
    bgColour: "bg-yellow-100",
  },
  freeItem: {
    icon: Gift,
    colour: "text-green-600",
    bgColour: "bg-green-100",
  },
  buyXgetY: {
    icon: ShoppingBag,
    colour: "text-blue-500",
    bgColour: "bg-sky-100",
  },
}

const RewardPage = ({ user }) => {
  const [reward, setReward] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isOwnedByUser, setIsOwnedByUser] = useState(false)
  const confirm = useConfirm()
  const { rewardId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [normalisedFrom, setNormalisedFrom] = useState(
    location.state?.from || "/restaurant"
  )

  useEffect(() => {
    if (normalisedFrom.startsWith("/restaurants/") && reward?.restaurant?._id) {
      const segments = normalisedFrom.split("/")
      const maybeRestaurantId = segments[2]
      if (maybeRestaurantId === reward?.restaurant?._id) {
        setNormalisedFrom("/rewards")
      }
    }
    const isOwnedByUserCheck =
      user?.role === "owner" &&
      user?.profile.restaurants.some((r) => r._id === reward?.restaurant._id)

    setIsOwnedByUser(isOwnedByUserCheck)
  }, [reward, normalisedFrom, user])

  useEffect(() => {
    const fetchReward = async () => {
      const dummyReward = {
        _id: "reward123",
        title: "10% Off Your Next Meal",
        startDate: "2025-06-01T00:00:00.000Z",
        endDate: "2025-12-31T23:59:59.000Z",
        type: "percentage",
        restaurant: {
          _id: "resto456",
          name: "BiteBack Bistro",
        },
        description:
          "Enjoy a 10% discount on your next visit to BiteBack Bistro.\nValid for dine-in only. Not stackable with other promotions.",
        price: 100,
        isActive: true,
      }
      try {
        // const response = await getRewardById(rewardId)
        setReward(dummyReward)
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
    fetchReward()
  }, [rewardId])

  const handleRedeemReward = async () => {
    const confirmed = await confirm(
      `Are you sure you want to use ${reward.price} points to redeem the reward "${reward?.title}"?`
    )
    if (confirmed) {
      console.log("Redeemed")
    }
    //   try {
    //     await redeemRewardItem({
    //       user: user,
    //     })
    //     toast.success("Successfully redeemed Reward")
    //     navigate(normalisedFrom, { replace: true })
    //   } catch (ex) {
    //     toast.error("Failed to redeem reward")
    //     throw ex
    //   }
    // }
  }

  //   const handleToggleActivate = async () => {
  //     try {
  //       const updated = await saveReward({
  //         _id: reward._id,
  //         isActive: !reward.isActive,
  //       })
  //       toast.success(`Reward ${updated.isActive ? "activated" : "deactivated"}`)
  //       setReward((prev) => ({ ...prev, ...updated }))
  //     } catch (ex) {
  //       toast.error("Failed to toggle reward status")
  //     }
  //   }

  const handleDeleteReward = async () => {
    const confirmed = await confirm(
      `Are you sure you want to delete the reward "${reward?.title}"?`
    )
    if (confirmed) {
      try {
        await deleteReward(reward._id)
        toast.success("Reward deleted")
        window.location = "/rewards"
      } catch (ex) {
        toast.error("Failed to delete reward")
        throw ex
      }
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

  const {
    _id,
    title,
    startDate,
    endDate,
    type,
    restaurant,
    description,
    price,
  } = reward
  const backup = {
    colour: "text-gray-500",
    bgColour: "bg-gray-100",
  }

  const { icon: Icon, colour, bgColour } = iconMap[type] ?? backup

  return (
    <div className="max-w-3xl mx-auto mt-8 px-4 relative">
      <BackButton from={normalisedFrom} />

      <Card className="mt-4 shadow-xl border relative">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <CardTitle className="text-2xl font-bold">{title}</CardTitle>
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
                      className="bg-white/20 hover:bg-white/30 text-white"
                    >
                      <Settings className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    align="end"
                    className="w-40 bg-white shadow-lg rounded-md"
                  >
                    <DropdownMenuItem
                      className="hover:bg-gray-100 text-gray-800"
                      onClick={() =>
                        navigate(`/rewards/edit/${_id}`, {
                          state: { from: location.pathname },
                        })
                      }
                    >
                      Edit Reward
                    </DropdownMenuItem>
                    {/* <DropdownMenuItem
                      onClick={handleToggleActivate}
                      className="hover:bg-gray-100 text-gray-800"
                    >
                      {reward.isActive
                        ? "Deactivate Reward"
                        : "Activate Reward"}
                    </DropdownMenuItem> */}
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
            <p>
              Available from{" "}
              <strong>
                {DateTime.fromISO(startDate).toLocaleString(
                  readableTimeSettings
                )}
              </strong>
              {" to "}
              <strong>
                {DateTime.fromISO(endDate).toLocaleString(readableTimeSettings)}
              </strong>
            </p>
            {(!user || user.role !== "customer") && (
              <p>
                Redeemable for <strong>{price} points</strong>
              </p>
            )}
          </div>
          {user?.role === "customer" ? (
            <Button variant="outline" size="sm" onClick={handleRedeemReward}>
              <DollarSign className="w-6 h-6" />
              Redeem Reward for<strong>{price} points</strong>
            </Button>
          ) : (
            <p className="text-muted-foreground">
              Please login to redeem reward
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default RewardPage
