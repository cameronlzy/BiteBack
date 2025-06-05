import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Star, Trash2 } from "lucide-react"
import { Button } from "./ui/button"
import { getRestaurant } from "@/services/restaurantService"
import { toast } from "react-toastify"
import { readableTimeSettings } from "@/utils/timeConverter"
import { DateTime } from "luxon"
import { Link } from "react-router-dom"
import LoadingSpinner from "./common/LoadingSpinner"
import ohnoImg from "@/assets/ohnobadge.png"
import lovethisImg from "@/assets/lovethisbadge.png"
import helpfulImg from "@/assets/helpfulbadge.png"
import thanksImg from "@/assets/thanksbadge.png"
import { addBadgeVote, removeBadgeVote } from "@/services/reviewService"
import BadgeReactions from "./common/BadgeReactions"
import OwnerReply from "./OwnerReply"

const badges = [
  { name: "helpful", image: helpfulImg },
  { name: "thanks", image: thanksImg },
  { name: "lovethis", image: lovethisImg },
  { name: "ohno", image: ohnoImg },
]

const ReviewCard = ({ review, user, onDelete }) => {
  const [restaurant, setRestaurant] = useState(null)
  const [selectedBadgeIndex, setSelectedBadgeIndex] = useState(
    review.selectedBadge ?? null
  )
  const [badgeCounts, setBadgeCounts] = useState([...review.badgesCount])

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const fetchedRestaurant = await getRestaurant(review.restaurant)
        setRestaurant(fetchedRestaurant)
      } catch (ex) {
        toast.error("Failed to fetch restaurant")
      }
    }
    fetchRestaurant()
  }, [])

  const handleBadgeReact = async (reviewId, badgeIndex) => {
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
    }
  }

  return (
    <Card key={review._id}>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <div>
            <Link
              to={`/user-details/${review.customer}`}
              className="font-semibold text-blue-600 underline"
            >
              {review.username}
            </Link>{" "}
            reviewed{" "}
            {restaurant ? (
              <span className="italic">{restaurant.name}</span>
            ) : (
              <LoadingSpinner size="sm" inline={true} />
            )}
          </div>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                className={`w-8 h-8 ${
                  review.rating >= i ? "text-yellow-500" : "text-gray-300"
                }`}
                fill={review.rating >= i ? "currentColor" : "none"}
              />
            ))}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-gray-700">
        <div className="relative">
          <p>
            <b>Date Visited:</b>{" "}
            {DateTime.fromISO(review.dateVisited).toLocaleString({
              ...readableTimeSettings,
              hour: undefined,
              minute: undefined,
            })}
          </p>
          <p>{review.reviewText}</p>
          <p>
            <b>Date Posted:</b>{" "}
            {DateTime.fromISO(review.createdAt).toLocaleString({
              ...readableTimeSettings,
              hour: undefined,
              minute: undefined,
            })}
          </p>
          {user &&
            (user?.profile?._id === review.customer ||
              user._id === review.customer) && (
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

        <BadgeReactions
          badges={badges}
          badgeCounts={badgeCounts}
          selectedBadgeIndex={selectedBadgeIndex}
          onReact={(index) => handleBadgeReact(review._id, index)}
        />

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
