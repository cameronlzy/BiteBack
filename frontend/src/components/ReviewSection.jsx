import {
  getReviewByRestaurant,
  saveReview,
  deleteReview,
} from "@/services/reviewService"
import { Fragment, useEffect, useState } from "react"
import { Navigate, useLocation, useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import ReviewForm from "./ReviewForm"
import ReviewCard from "./ReviewCard"
import { Button } from "./ui/button"
import SortBy from "./common/SortBy"

const ReviewSection = ({ restaurant, user, showRestaurant }) => {
  const [reviews, setReviews] = useState([])
  const [sortedReviews, setSortedReviews] = useState([])
  const [showForm, setShowForm] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

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

  const handleShowForm = () => {
    if (!user && !showForm) {
      toast.info("Please Log in First")
      return navigate("/login", {
        state: { from: location.pathname },
        replace: true,
      })
    }
    setShowForm((prev) => !prev)
  }

  const handleReviewSubmit = async (newReview) => {
    try {
      const savedReview = await saveReview(newReview)
      savedReview.badgesCount = [0, 0, 0, 0]
      setShowForm(false)
      return savedReview
    } catch (ex) {
      if (ex.response && ex.response.status === 403) {
        toast.info("You must be logged in as a customer to leave a review.")
      }
    }
  }

  const handleReviewDelete = async (reviewId) => {
    try {
      await deleteReview(reviewId)
      setReviews((prev) => prev.filter((r) => r._id !== reviewId))
      setSortedReviews((prev) => prev.filter((r) => r._id !== reviewId))
      toast.success("Review deleted successfully.")
    } catch (ex) {}
  }

  return (
    <Fragment>
      {user?.role !== "owner" && (
        <div className="mb-4">
          <Button
            onClick={handleShowForm}
            className="w-[180px] h-11 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold rounded-full px-6 py-2 transition-colors duration-300 shadow"
          >
            {showForm ? "Cancel" : "Leave a Review"}
          </Button>

          <div
            className={`transition-all duration-500 ease-in-out overflow-hidden ${
              showForm ? "max-h-[1000px] opacity-100 mt-4" : "max-h-0 opacity-0"
            }`}
          >
            <ReviewForm
              restaurant={restaurant}
              onSubmit={handleReviewSubmit}
              setReviews={setReviews}
              setSortedReviews={setSortedReviews}
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
