import {
  getReviewByRestaurant,
  saveReview,
  deleteReview,
} from "@/services/reviewService"
import { Fragment, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import ReviewForm from "./ReviewForm"
import ReviewCard from "./ReviewCard"
import SortBy from "../common/SortBy"

const ReviewSection = ({
  restaurant,
  user,
  showRestaurant,
  showReviewForm,
  setShowReviewForm,
}) => {
  const [reviews, setReviews] = useState([])
  const [sortedReviews, setSortedReviews] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const fetchedReviews = await getReviewByRestaurant(restaurant._id)
        setReviews(fetchedReviews)
        setSortedReviews(fetchedReviews)
      } catch (ex) {
        if (ex.response && ex.response.status === 404) {
          navigate("/not-found", { replace: true })
        }
      }
    }
    fetchReviews()
  }, [])

  const sortOptions = [
    { label: "Date Posted", value: "createdAt" },
    { label: "Date Visited", value: "dateVisited" },
    { label: "Rating", value: "rating" },
  ]

  const handleReviewSubmit = async (newReview) => {
    try {
      console.log(newReview)
      const savedReview = await saveReview(newReview)
      savedReview.badgesCount = [0, 0, 0, 0]
      setShowReviewForm(false)
      return savedReview
    } catch (ex) {
      if (ex.response?.status === 403 || ex.response?.status === 401) {
        toast.info("You must be logged in as a customer to leave a review.")
        window.location = "/login"
      }
    }
  }

  const handleReviewDelete = async (reviewId) => {
    await deleteReview(reviewId)
    setReviews((prev) => prev.filter((r) => r._id !== reviewId))
    setSortedReviews((prev) => prev.filter((r) => r._id !== reviewId))
    toast.success("Review deleted successfully.")
  }

  return (
    <Fragment>
      {user?.role !== "owner" && (
        <div className="mb-4">
          <div
            className={`transition-all duration-500 ease-in-out overflow-hidden ${
              showReviewForm
                ? "max-h-[1000px] opacity-100 mt-4"
                : "max-h-0 opacity-0"
            }`}
          >
            <ReviewForm
              restaurant={restaurant}
              onSubmit={handleReviewSubmit}
              setReviews={setReviews}
              setSortedReviews={setSortedReviews}
              user={user}
            />
          </div>
        </div>
      )}
      <div className="flex justify-between items-center mt-6 mb-4">
        <h2 className="text-2xl font-semibold">Current Reviews</h2>
        <SortBy
          options={sortOptions}
          items={reviews}
          onSorted={setSortedReviews}
        />
      </div>
      {sortedReviews.map((r) => (
        <ReviewCard
          key={r._id}
          review={r}
          currentRestaurant={restaurant}
          user={user}
          onDelete={handleReviewDelete}
          showRestaurant={showRestaurant}
        />
      ))}
    </Fragment>
  )
}

export default ReviewSection
