import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Star, Trash2 } from "lucide-react"
import { Button } from "./ui/button"
import { useState, useEffect } from "react"
import { getRestaurant } from "@/services/restaurantService"
import { toast } from "react-toastify"
import { readableTimeSettings } from "@/utils/timeConverter"
import { DateTime } from "luxon"
import { Link } from "react-router-dom"

const ReviewCard = ({ review, user, onDelete }) => {
  const [restaurant, setRestaurant] = useState(null)

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const fetchedRestaurant = await getRestaurant(review.restaurant)
        setRestaurant(fetchedRestaurant)
      } catch (ex) {
        toast.error("Failed to fetch restaurant:", ex)
      }
    }
    fetchRestaurant()
  }, [])

  console.log(review)

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
              <span className="italic text-gray-400">Loading...</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
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
          <p>
            <b>Comments:</b> {review.reviewText}
          </p>
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
        {/*  */}

        {/* OwnerReplySection */}
      </CardContent>
    </Card>
  )
}

export default ReviewCard
