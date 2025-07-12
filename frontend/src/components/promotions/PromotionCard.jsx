import { Card, CardTitle } from "@/components/ui/card"
import { DateTime } from "luxon"
import { Link } from "react-router-dom"
import defaultRestImg from "@/assets/default-restaurant-img.png"
import {
  hasItemEnded,
  hasItemStarted,
  isPromotionAvailable,
  readableTimeSettings,
} from "@/utils/timeConverter"
import DisabledBlur from "../common/disabledBlur"

const PromotionCard = ({
  _id,
  title,
  startDate,
  endDate,
  bannerImage,
  restaurant,
  isActive,
  timeWindow,
}) => {
  const promotion = {
    _id,
    title,
    startDate,
    endDate,
    bannerImage,
    restaurant,
    isActive,
    timeWindow,
  }
  const isAvailable = isPromotionAvailable(promotion)
  const hasStarted = hasItemStarted(promotion)
  const hasEnded = hasItemEnded(promotion)
  const imageSrc = bannerImage || defaultRestImg
  return (
    <Card className="w-full p-4 rounded-xl shadow-md">
      <DisabledBlur
        component={imageSrc}
        isImage={true}
        disabled={!hasStarted || hasEnded || !isActive || !isAvailable}
        disabledMessage={
          !hasStarted
            ? "Promotion has not started"
            : !isActive
            ? "Promotion currently not active"
            : hasEnded
            ? "Promotion has ended"
            : !isAvailable
            ? "Not Available at this time"
            : ""
        }
      />

      <div className="text-left space-y-2 w-full">
        <CardTitle className="text-2xl font-semibold">
          {hasEnded ? (
            <span className="text-gray-500">{title}</span>
          ) : (
            <Link
              to={`/promotions/${_id}`}
              state={{ from: location.pathname }}
              className="text-black hover:text-gray-700 hover:underline transition-colors"
            >
              {title} by {restaurant?.name}
            </Link>
          )}
        </CardTitle>

        <div className="text-sm text-gray-600 space-y-1">
          {hasEnded ? (
            <p className="text-gray-500">This promotion has ended.</p>
          ) : !hasStarted ? (
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
        </div>
      </div>
    </Card>
  )
}

export default PromotionCard
