import { useIsMobile } from "@/hooks/useIsMobile"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import { Calendar, Users, Store, Star, Crown, Utensils } from "lucide-react"
import { isWithinOpeningHours } from "@/utils/timeConverter"

const CarouselButtonSwitcher = ({
  restaurant,
  user,
  showReviewForm,
  setShowReviewForm,
}) => {
  const isMobile = useIsMobile()
  const navigate = useNavigate()

  const isOwnedByUser = user?.profile?.restaurants?.some(
    (r) => r._id === restaurant._id
  )
  const isCustomer = !user || user.role === "customer"

  const actions = [
    user?.role !== "owner" && {
      wordShown: "Queue",
      icon: Users,
      onClick: () => navigate(`/online-queue/${restaurant._id}`),
      bgColor: "bg-white",
      hoverColor: "hover:bg-gray-100",
      textColor: "text-black",
      disabled:
        !isWithinOpeningHours(restaurant.openingHours) ||
        !restaurant.queueEnabled,
    },
    (isOwnedByUser || isCustomer) && {
      wordShown: "Make Reservation",
      icon: Calendar,
      onClick: () => navigate(`/reservation/${restaurant._id}`),
      bgColor: "bg-black",
      hoverColor: "hover:bg-gray-900",
      textColor: "text-white",
      wide: true,
    },
    user?.role !== "owner" && {
      wordShown: "Rewards",
      icon: Store,
      onClick: () => navigate(`/current-rewards/${restaurant._id}`),
      bgColor: "bg-indigo-600",
      hoverColor: "hover:bg-indigo-700",
      textColor: "text-white",
    },
    user?.role !== "owner" && {
      wordShown: showReviewForm ? "Cancel" : "Review",
      icon: Star,
      onClick: () => setShowReviewForm((prev) => !prev),
      bgColor: "bg-yellow-400",
      hoverColor: "hover:bg-yellow-500",
      textColor: "text-black",
    },
    user?.role !== "owner" && {
      wordShown: "Member Events",
      icon: Crown,
      onClick: () => navigate(`/member-events/${restaurant._id}`),
      bgColor: "bg-emerald-500",
      hoverColor: "hover:bg-emerald-600",
      textColor: "text-white",
      wide: true,
    },
    user?.role !== "owner" && {
      wordShown: "Menu",
      icon: Utensils,
      onClick: () => navigate(`/pre-order/${restaurant._id}`),
      bgColor: "bg-orange-500",
      hoverColor: "hover:bg-orange-600",
      textColor: "text-white",
    },
  ].filter(Boolean)

  return (
    <div className="mt-4 flex justify-center w-full">
      {user?.role === "owner" ? (
        <Button
          onClick={() => navigate(`/reservation/${restaurant._id}`)}
          className="w-full max-w-xs h-11 rounded-full flex gap-2 justify-center items-center text-sm font-medium bg-black hover:bg-gray-900 text-white"
        >
          <Calendar className="w-4 h-4" />
          Make Reservation
        </Button>
      ) : (
        <div className="grid grid-cols-2 grid-rows-3 sm:grid-cols-3 sm:grid-rows-2 gap-x-0 gap-y-2 sm:gap-4 w-full max-w-2xl">
          {actions.map((action, index) => (
            <div key={index} className="flex flex-col items-center col-span-1">
              <Button
                disabled={action.disabled}
                onClick={action.onClick}
                className={`
                h-11 rounded-full flex gap-2 justify-center items-center text-sm font-medium
                ${action.bgColor} ${action.hoverColor} ${action.textColor}
                ${action.disabled ? "opacity-50 cursor-not-allowed" : ""}
                w-11 sm:w-full
              `}
              >
                <action.icon className="w-4 h-4" />
                {!isMobile && (
                  <span className="inline">{action.wordShown}</span>
                )}
              </Button>
              {isMobile && (
                <span className="text-xs mt-1 text-center w-[60px] leading-tight">
                  {action.wordShown}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default CarouselButtonSwitcher
