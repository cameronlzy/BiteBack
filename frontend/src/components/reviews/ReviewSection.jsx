import {
  getReviewByRestaurant,
  saveReview,
  deleteReview,
} from "@/services/reviewService"
import { useEffect, useState } from "react"
import { toast } from "react-toastify"
import ReviewForm from "./ReviewForm"
import ReviewCard from "./ReviewCard"
import SortBy from "../common/SortBy"
import { useSearchParams } from "react-router-dom"
import Pagination from "../common/Pagination"
import LoadingSpinner from "../common/LoadingSpinner"
import NoResultsFound from "../common/NoResultsFound"

const ReviewSection = ({
  restaurant,
  user,
  showRestaurant,
  showReviewForm,
}) => {
  const [reviews, setReviews] = useState([])
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const page = parseInt(searchParams.get("page")) || 1
  const sortBy = searchParams.get("sortBy") || "dateVisited"
  const order = searchParams.get("order") || "desc"

  const sortOptions = [
    { label: "Date Visited", value: "dateVisited" },
    { label: "Rating", value: "rating" },
  ]

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true)
      try {
        const data = await getReviewByRestaurant(restaurant._id, {
          page,
          limit: 8,
          sortBy,
          order,
        })
        setReviews(data.reviews)
        setTotalPages(data.totalPages)
        setTotalCount(data.totalCount)
      } catch (ex) {
        toast.error("Failed to fetch reviews")
        throw ex
      } finally {
        setLoading(false)
      }
    }
    fetchReviews()
  }, [page, sortBy, order])

  const handleSort = ({ value, direction }) => {
    setSearchParams({
      page: 1,
      sortBy: value,
      order: direction,
    })
  }

  const handlePageChange = (newPage) => {
    setSearchParams({
      page: newPage,
      sortBy,
      order,
    })
  }

  const handleReviewDelete = async (id) => {
    await deleteReview(id)
    toast.success("Deleted")
    setReviews((prev) => prev.filter((r) => r._id !== id))
  }

  if (loading) return <LoadingSpinner />

  return (
    <>
      {user?.role !== "owner" && showReviewForm && (
        <ReviewForm restaurant={restaurant} user={user} onSubmit={saveReview} />
      )}

      <div className="flex justify-between items-center mt-6 mb-4">
        <h2 className="text-2xl font-semibold">Current Reviews</h2>
        <SortBy
          options={sortOptions}
          backendHandle={true}
          onSorted={handleSort}
          selectedValue={sortBy}
          selectedDirection={order}
          className="mb-4"
        />
      </div>

      {reviews.length === 0 ? (
        <NoResultsFound text="No reviews found." />
      ) : (
        reviews?.map((r) => (
          <ReviewCard
            key={r._id}
            review={r}
            currentRestaurant={restaurant}
            user={user}
            onDelete={handleReviewDelete}
            showRestaurant={showRestaurant}
          />
        ))
      )}

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalCount={totalCount}
        onPageChange={handlePageChange}
      />
    </>
  )
}

export default ReviewSection
