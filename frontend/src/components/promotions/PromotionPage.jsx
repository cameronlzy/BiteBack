import { DateTime } from "luxon"
import {
  hasItemStarted,
  isPromotionAvailable,
  readableTimeSettings,
} from "@/utils/timeConverter"
import { useConfirm } from "@/components/common/ConfirmProvider"
import BackButton from "@/components/common/BackButton"
import { useEffect, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import LoadingSpinner from "@/components/common/LoadingSpinner"
import {
  getPromotionById,
  deletePromotion,
  savePromotion,
} from "@/services/promotionService"
import { AlertTriangle, Clock } from "lucide-react"
import { toast } from "react-toastify"
import { ownedByUser } from "@/utils/ownerCheck"
import RestaurantRelatedItemUI from "../common/RestaurantRelatedItemUI"

const PromotionPage = ({ user }) => {
  const [promotion, setPromotion] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isOwnedByUser, setIsOwnedByUser] = useState(false)
  const confirm = useConfirm()
  const { promotionId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from || "/promotions"

  useEffect(() => {
    const result = ownedByUser(promotion?.restaurant, user)
    setIsOwnedByUser(result)
  }, [promotion, user])

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

  const handleToggleActivate = async () => {
    try {
      const updated = await savePromotion({
        _id,
        isActive: !promotion.isActive,
      })
      toast.success(`Promotion ${updated.isActive ? "resumed" : "paused"}`)
      setPromotion((prev) => ({
        ...prev,
        isActive: updated.isActive,
      }))
    } catch (ex) {
      toast.error("Failed to toggle promotion status")
      throw ex
    }
  }

  const handleDeletePromotion = async () => {
    const confirmed = await confirm(
      `Are you sure you want to delete the promotion "${promotion?.title}"?`
    )
    if (confirmed) {
      try {
        await deletePromotion(_id)
        toast.success("Promotion deleted")
        window.location = "/owner/events-promos"
      } catch (ex) {
        toast.error("Failed to delete promotion")
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

  const {
    _id,
    title,
    startDate,
    endDate,
    mainImage,
    restaurant,
    description,
    timeWindow,
  } = promotion
  const isAvailable = isPromotionAvailable(promotion)
  const hasStarted = hasItemStarted(promotion)
  const isActive = promotion.isActive
  return (
    <RestaurantRelatedItemUI
      type="Promotion"
      restaurant={restaurant}
      from={from}
      title={title}
      description={description}
      image={mainImage}
      isOwnedByUser={isOwnedByUser}
      onEdit={() =>
        navigate(`/promotions/edit/${_id}`, {
          state: { from: location.pathname },
        })
      }
      onDelete={!hasStarted ? handleDeletePromotion : null}
      onActivate={handleToggleActivate}
      currentlyActive={isActive}
      activatePhrase="Resume Promotion"
      deactivatePhrase="Pause Promotion"
      banner={
        !hasStarted ? (
          <div className="bg-yellow-50 text-yellow-900 border-t-4 border-yellow-400 px-4 py-3 flex items-center justify-between rounded-t-md">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">Promotion has not started yet</span>
            </div>
          </div>
        ) : !isActive ? (
          <div className="bg-gray-100 text-gray-800 border-t-4 border-gray-400 px-4 py-3 flex items-center justify-between rounded-t-md">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">This promotion is inactive</span>
            </div>
          </div>
        ) : !isAvailable ? (
          <div className="bg-yellow-50 text-yellow-900 border-t-4 border-yellow-400 px-4 py-3 flex items-center justify-between rounded-t-md">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">Not available at this time</span>
            </div>
          </div>
        ) : null
      }
      metaContent={
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
                {DateTime.fromISO(endDate).toLocaleString(readableTimeSettings)}
              </strong>
            </p>
          )}
          <div className="flex justify-center">
            {timeWindow?.startTime && timeWindow?.endTime && (
              <p className="text-gray-500 flex items-center gap-1">
                <Clock className="w-4 h-4 inline-block" />
                Available from {timeWindow.startTime} - {timeWindow.endTime}
              </p>
            )}
          </div>
        </div>
      }
    />
  )
}

export default PromotionPage
