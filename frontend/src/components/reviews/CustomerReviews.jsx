import React, { useEffect, useState } from "react"
import { useConfirm } from "../common/ConfirmProvider"
import { toast } from "react-toastify"
import SortBy from "../common/SortBy"
import { getReviewsByCustomer, deleteReview } from "@/services/reviewService"
import ReviewCard from "./ReviewCard"
import { useSearchParams } from "react-router-dom"
import Pagination from "../common/Pagination"
import LoadingSpinner from "../common/LoadingSpinner"

const CustomerReviews = ({ viewedCustomer, user }) => {
  const [reviews, setReviews] = useState([])
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const page = parseInt(searchParams.get("page")) || 1
  const sortBy = searchParams.get("sortBy") || "createdAt"
  const order = searchParams.get("order") || "desc"

  const confirm = useConfirm()

  const sortOptions = [
    { label: "Date Visited", value: "dateVisited" },
    { label: "Rating", value: "rating" },
  ]

  const getAndSetReviews = async () => {
    setLoading(true)
    try {
      const data = await getReviewsByCustomer(viewedCustomer?._id, {
        page,
        limit: 8,
        sortBy,
        order,
      })
      setReviews(data.reviews)
      setTotalPages(data.totalPages)
      setTotalCount(data.totalCount)
    } catch (ex) {
      toast.error("Failed to load reviews")
      throw ex
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getAndSetReviews()
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
    const confirmed = await confirm("Delete review?")
    if (!confirmed) return
    await deleteReview(id)
    toast.success("Review deleted")
    getAndSetReviews()
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <h2 className="text-2xl font-bold mb-6">
        {user._id === viewedCustomer._id ? "Your" : "Their"} Reviews
      </h2>

      {reviews?.length === 0 ? (
        <p className="text-gray-500 mb-2">No reviews found.</p>
      ) : (
        <>
          <SortBy
            options={sortOptions}
            backendHandle={true}
            onSorted={handleSort}
            className="mb-4"
          />
          {reviews?.map((review) => (
            <ReviewCard
              key={review._id}
              review={review}
              currentRestaurant={review.restaurant}
              user={viewedCustomer}
              onDelete={handleReviewDelete}
              showRestaurant={true}
            />
          ))}
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalCount={totalCount}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  )
}

export default CustomerReviews
