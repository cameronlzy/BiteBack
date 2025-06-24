import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DateTime } from "luxon"
import {
  hasPromotionStarted,
  isPromotionAvailable,
  readableTimeSettings,
} from "@/utils/timeConverter"
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import {
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu"
import { Settings } from "lucide-react"
import { useConfirm } from "@/components/common/ConfirmProvider"
import BackButton from "@/components/common/BackButton"
import { useEffect, useState } from "react"
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"
import LoadingSpinner from "@/components/common/LoadingSpinner"
import { getPromotionById, deletePromotion } from "@/services/promotionService"
import { Button } from "@/components/ui/button"
import { AlertTriangle, ArrowRight } from "lucide-react"
import { toast } from "react-toastify"

const PromotionPage = ({ user }) => {
  const [promotion, setPromotion] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isOwnedByUser, setIsOwnedByUser] = useState(false)
  const confirm = useConfirm()
  const { promotionId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [normalizedFrom, setNormalizedFrom] = useState(
    location.state?.from || "/promotions"
  )

  useEffect(() => {
    if (
      normalizedFrom.startsWith("/restaurants/") &&
      promotion?.restaurant?._id
    ) {
      const segments = normalizedFrom.split("/")
      const maybeRestaurantId = segments[2]
      if (maybeRestaurantId === restaurant._id) {
        setNormalizedFrom("/promotions")
      }
    } else if (
      normalizedFrom.startsWith("/promotions/edit/") &&
      promotion?._id
    ) {
      const segments = normalizedFrom.split("/")
      const maybePromotionId = segments[3]
      if (maybePromotionId === promotion._id) {
        setNormalizedFrom("/promotions")
      }
    }
    const isOwnedByUserCheck =
      user?.role === "owner" &&
      user?.profile.restaurants.some((r) => r._id === promotion?.restaurant._id)

    setIsOwnedByUser(isOwnedByUserCheck)
  }, [promotion, normalizedFrom, user])

  useEffect(() => {
    const fetchPromotion = async () => {
      try {
        const response = await getPromotionById(promotionId)
        setPromotion(response)
      } catch (ex) {
        if (ex.response?.status === 404 || ex.response?.status === 400) {
          toast.error("Promotion not found", {
            toastId: "toast-promotion-not-found",
          })
          navigate("/not-found")
          setPromotion(null)
          return
        }
        setPromotion(null)
        throw ex
      } finally {
        setLoading(false)
      }
    }
    fetchPromotion()
  }, [promotionId])

  const handleDeletePromotion = async () => {
    const confirmed = await confirm(
      `Are you sure you want to delete the promotion \"${promotion?.title}\"?`
    )
    if (confirmed) {
      try {
        await deletePromotion(_id)
        toast.success("Promotion deleted")
        window.location = "/promotions"
      } catch (err) {
        toast.error("Failed to delete promotion")
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

  if (!promotion) {
    return (
      <div className="text-center text-lg text-gray-500 mt-10">
        <div className="mt-4">
          <BackButton from={-1} />
        </div>
        Promotion not found.
      </div>
    )
  }

  const { _id, title, startDate, endDate, mainImage, restaurant, description } =
    promotion

  const isAvailable = isPromotionAvailable(promotion)
  const hasStarted = hasPromotionStarted(promotion)

  return (
    <div className="max-w-3xl mx-auto mt-8 px-4 relative">
      <BackButton from={normalizedFrom} />
      {!hasStarted ? (
        <div className="bg-yellow-50 text-yellow-900 border-t-4 border-yellow-400 px-4 py-3 flex items-center justify-between rounded-t-md">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">Promotion has not started yet</span>
          </div>
        </div>
      ) : !isAvailable ? (
        <div className="bg-yellow-50 text-yellow-900 border-t-4 border-yellow-400 px-4 py-3 flex items-center justify-between rounded-t-md">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">Not available at this time</span>
          </div>
        </div>
      ) : null}
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
          <div className="relative">
            {mainImage && (
              <img
                src={mainImage}
                alt="Main"
                className="w-full rounded-md object-cover border"
              />
            )}

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
                        navigate(`/promotions/edit/${_id}`, {
                          state: { from: location.pathname },
                        })
                      }
                    >
                      Edit Promotion
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleDeletePromotion}
                      className="text-red-600 hover:bg-red-50 focus:bg-red-100 focus:text-red-700 font-medium"
                    >
                      Delete Promotion
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
            {!hasStarted ? (
              <p>
                Starting on{" "}
                <strong>
                  {DateTime.fromISO(startDate).toLocaleString(
                    readableTimeSettings
                  )}
                </strong>
              </p>
            ) : (
              <p>
                Available till{" "}
                <strong>
                  {DateTime.fromISO(endDate).toLocaleString(
                    readableTimeSettings
                  )}
                </strong>
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default PromotionPage
