import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2 } from "lucide-react"
import { Button } from "../ui/button"
import { getRestaurant } from "@/services/restaurantService"
import { toast } from "react-toastify"
import { readableTimeSettings } from "@/utils/timeConverter"
import { DateTime } from "luxon"
import { Link } from "react-router-dom"
import LoadingSpinner from "../common/LoadingSpinner"
import { addBadgeVote, removeBadgeVote } from "@/services/reviewService"
import BadgeReactions from "../common/BadgeReactions"
import OwnerReply from "./OwnerReply"
import StarRating from "../common/StarRating"
import { badges } from "@/utils/badges"

const ReviewCard = ({ review, user, onDelete, showRestaurant }) => {
  const [restaurant, setRestaurant] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState([false, false, false, false])
  const [selectedBadgeIndex, setSelectedBadgeIndex] = useState(
    review.selectedBadge ?? null
  )
  const [badgeCounts, setBadgeCounts] = useState([...review.badgesCount])

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const fetchedRestaurant = await getRestaurant(review.restaurant)
        setRestaurant(fetchedRestaurant)
      } catch {
        toast.error("Failed to fetch restaurant")
      }
    }
    fetchRestaurant()
  }, [])

  const handleBadgeReact = async (reviewId, badgeIndex) => {
    if (!user) {
      toast.info("Please log in")
      return
    }
    const newSubmitting = [...isSubmitting]
    newSubmitting[badgeIndex] = true
    setIsSubmitting(newSubmitting)
    try {
      const newCounts = [...badgeCounts]

      if (selectedBadgeIndex === badgeIndex) {
        await removeBadgeVote(reviewId)
        newCounts[badgeIndex] = Math.max(0, newCounts[badgeIndex] - 1)
        setSelectedBadgeIndex(null)
      } else {
        await addBadgeVote(reviewId, badgeIndex)
        newCounts[badgeIndex] = (newCounts[badgeIndex] ?? 0) + 1

        if (selectedBadgeIndex !== null) {
          newCounts[selectedBadgeIndex] = Math.max(
            0,
            (newCounts[selectedBadgeIndex] ?? 1) - 1
          )
        }

        setSelectedBadgeIndex(badgeIndex)
      }

      setBadgeCounts(newCounts)
    } catch (ex) {
      if (ex.response?.status === 403) {
        toast.info("Owners not allowed to react to reviews")
      } else {
        toast.error("Failed to update reaction")
      }
    } finally {
      setIsSubmitting([false, false, false, false])
    }
  }

  return (
    <Card key={review._id} className="mb-4">
      <CardHeader>
        <CardTitle className="flex flex-wrap justify-between items-start space-y-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div>
              <Link
                to={`/user-details/${review.customer}`}
                state={{ from: location.pathname }}
                className="font-semibold text-blue-600 underline"
              >
                {review.username}
              </Link>{" "}
              {showRestaurant && (
                <>
                  reviewed{" "}
                  {restaurant ? (
                    <span className="italic">{restaurant.name}</span>
                  ) : (
                    <LoadingSpinner size="sm" inline={true} />
                  )}
                </>
              )}
            </div>
            <p className="font-semibold text-sm text-gray-500">
              {DateTime.fromISO(review.createdAt).toLocaleString({
                ...readableTimeSettings,
                hour: undefined,
                minute: undefined,
              })}
            </p>
          </div>
          <div>
            <StarRating rating={review.rating} className="w-6 h-6" />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-gray-700">
        <div className="relative">
          {review.images && review.images.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {review.images.map((url, idx) => (
                <Link
                  key={idx}
                  to={`/images/${encodeURIComponent(url)}`}
                  state={{ from: location.pathname }}
                >
                  <img
                    src={url}
                    alt={`review image ${idx + 1}`}
                    className="w-20 h-20 object-cover rounded-md border border-gray-300 shadow-sm hover:opacity-90 transition-opacity"
                  />
                </Link>
              ))}
            </div>
          )}
          <p className="text-left">{review.reviewText}</p>
          <i className="block text-left text-gray-500 mt-2">
            Visited on{" "}
            {DateTime.fromISO(review.dateVisited).toLocaleString({
              ...readableTimeSettings,
              hour: undefined,
              minute: undefined,
            })}
          </i>
        </div>
        <div className="flex justify-between items-center">
          <div>
            <BadgeReactions
              badges={badges}
              badgeCounts={badgeCounts}
              selectedBadgeIndex={selectedBadgeIndex}
              onReact={(index) => handleBadgeReact(review._id, index)}
              isSubmitting={isSubmitting}
            />
          </div>
          {user && showRestaurant && onDelete && (
            <Button
              variant="ghost"
              className="text-red-600 hover:bg-red-100 transition-colors"
              onClick={() => onDelete(review._id)}
            >
              <Trash2 className="w-5 h-5" />
              Delete Review
            </Button>
          )}
        </div>
        <OwnerReply
          review={review}
          user={user}
          restaurant={restaurant}
          onReplyChange={(newReply) => {
            review.reply = newReply
          }}
        />
      </CardContent>
    </Card>
  )
}

export default ReviewCard
