import { useState } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Users,
  Store,
  Star,
  Crown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { isWithinOpeningHours } from "@/utils/timeConverter"
import RoundedActionButton from "./RoundedActionButton"
import { useIsMobile } from "@/hooks/useIsMobile"

const CarouselButtonSwitcher = ({
  restaurant,
  user,
  showReviewForm,
  setShowReviewForm,
}) => {
  const isMobile = useIsMobile()

  const isOwnedByUser = user?.profile?.restaurants?.some(
    (r) => r._id === restaurant._id
  )
  const isCustomer = !user || user.role === "customer"

  const actions = [
    (isOwnedByUser || isCustomer) && {
      label: isOwnedByUser ? "Book Event" : "Make Reservation",
      icon: Calendar,
      to: `/reservation/${restaurant._id}`,
      bgColor: "bg-black",
      hoverColor: "hover:bg-gray-900",
      textColor: "text-white",
      expandedWidth: "w-[170px]",
    },
    user?.role !== "owner" && {
      label: "View Queue",
      icon: Users,
      to: `/online-queue/${restaurant._id}`,
      bgColor: "bg-white",
      hoverColor: "hover:bg-gray-100",
      textColor: "text-black",
      expandedWidth: "w-[140px]",
      disabled:
        !isWithinOpeningHours(restaurant.openingHours) ||
        !restaurant.queueEnabled,
      preventNavigation:
        !isWithinOpeningHours(restaurant.openingHours) ||
        !restaurant.queueEnabled,
    },
    user?.role !== "owner" && {
      label: "View Rewards",
      icon: Store,
      to: `/current-rewards/${restaurant._id}`,
      bgColor: "bg-indigo-600",
      hoverColor: "hover:bg-indigo-700",
      textColor: "text-white",
      expandedWidth: "w-[150px]",
    },
    user?.role !== "owner" && {
      label: showReviewForm ? "Cancel" : "Leave a Review",
      icon: Star,
      to: "#",
      bgColor: "bg-yellow-400",
      hoverColor: "hover:bg-yellow-500",
      textColor: "text-black",
      preventNavigation: true,
      expandedWidth: showReviewForm ? "w-[110px]" : "w-[160px]",
      onClick: () => setShowReviewForm((prev) => !prev),
    },
    user?.role !== "owner" && {
      label: "View Member Events",
      icon: Crown,
      to: `/member-events/${restaurant._id}`,
      bgColor: "bg-emerald-500",
      hoverColor: "hover:bg-emerald-600",
      textColor: "text-white",
      expandedWidth: "w-[190px]",
    },
  ].filter(Boolean)

  const [index, setIndex] = useState(0)
  const current = actions[index]

  const handlePrev = () =>
    setIndex((prev) => (prev - 1 + actions.length) % actions.length)
  const handleNext = () => setIndex((prev) => (prev + 1) % actions.length)

  return (
    <div className="flex items-center justify-center gap-4 mt-4">
      <Button variant="ghost" size="icon" onClick={handlePrev}>
        <ChevronLeft className="h-5 w-5" />
      </Button>

      <div>
        <div className="w-full flex justify-center flex-col items-center">
          <RoundedActionButton
            to={current.to}
            icon={current.icon}
            label={current.label}
            bgColor={current.bgColor}
            hoverColor={current.hoverColor}
            textColor={current.textColor}
            disabled={current.disabled}
            preventNavigation={current.preventNavigation}
            showOnlyOnHover={true}
            expandedWidth={current.expandedWidth}
            {...(current.onClick ? { onClick: current.onClick } : {})}
          />
          {isMobile && (
            <div className="text-sm font-medium mt-2 text-center">
              {current.label}
            </div>
          )}
        </div>
      </div>

      <Button variant="ghost" size="icon" onClick={handleNext}>
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  )
}

export default CarouselButtonSwitcher
