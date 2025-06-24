import { Card, CardTitle } from "@/components/ui/card"
import { DateTime } from "luxon"
import { Link } from "react-router-dom"
import defaultRestImg from "@/assets/default-restaurant-img.png"
import {
  hasPromotionEnded,
  hasPromotionStarted,
  isPromotionAvailable,
  readableTimeSettings,
} from "@/utils/timeConverter"

const PromotionCard = (promotion) => {
  const isAvailable = isPromotionAvailable(promotion)
  const hasStarted = hasPromotionStarted(promotion)
  const hasEnded = hasPromotionEnded(promotion)
  const { _id, title, description, startDate, endDate, bannerImage } = promotion
  const imageSrc = bannerImage || defaultRestImg

  return (
    <Card className="w-full p-4 rounded-xl shadow-md">
      <div className="relative">
        <img
          src={imageSrc}
          alt={title}
          className="w-full h-auto object-cover rounded-lg border border-gray-200 shadow-sm"
          onError={(e) => {
            e.target.onerror = null
            e.target.src = defaultRestImg
          }}
        />
        {(!hasStarted || hasEnded || !isAvailable) && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-m flex items-center justify-center text-gray-700 font-semibold text-lg rounded-lg">
            {!hasStarted
              ? "Promotion has not started"
              : hasEnded
              ? "Promotion has ended"
              : !isAvailable
              ? "Not Available at this time"
              : null}
          </div>
        )}
      </div>

      <div className="text-left space-y-2 w-full">
        <CardTitle className="text-2xl font-bold">
          {hasEnded ? (
            <span className="text-gray-500 line-through">{title}</span>
          ) : (
            <Link
              to={`/promotions/${_id}`}
              state={{ from: location.pathname }}
              className="text-black hover:text-gray-700 hover:underline transition-colors"
            >
              {title}
            </Link>
          )}
        </CardTitle>

        <p className="text-gray-700 text-base whitespace-pre-line line-clamp-2">
          {description}
        </p>

        <div className="text-sm text-gray-600 space-y-1">
          <p>
            <strong>Start:</strong>{" "}
            {DateTime.fromISO(startDate).toLocaleString(readableTimeSettings)}
          </p>
          <p>
            <strong>End:</strong>{" "}
            {DateTime.fromISO(endDate).toLocaleString(readableTimeSettings)}
          </p>
        </div>
      </div>
    </Card>
  )
}

export default PromotionCard
