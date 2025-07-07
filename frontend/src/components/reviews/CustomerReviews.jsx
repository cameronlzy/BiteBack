import React, { useEffect, useState } from "react"
import { useConfirm } from "../common/ConfirmProvider"
import { toast } from "react-toastify"
import SortBy from "../common/SortBy"
import { getReviewsByCustomer, deleteReview } from "@/services/reviewService"
import ReviewCard from "./ReviewCard"

const CustomerReviews = ({ viewedCustomer, user }) => {
  const [reviews, setReviews] = useState([])
  const [sortedReviews, setSortedReviews] = useState([])
  const confirm = useConfirm()

  const sortOptions = [
    { label: "Date Posted", value: "createdAt" },
    { label: "Date Visited", value: "dateVisited" },
    { label: "Rating", value: "rating" },
  ]

  const getAndSetReviews = async () => {
    try {
      const queriedReviews = await getReviewsByCustomer(
        viewedCustomer?.profile?._id ?? viewedCustomer?._id
      )
      setReviews(queriedReviews)
      setSortedReviews(queriedReviews)
    } catch (ex) {
      toast.error("Failed to load reviews")
      throw ex
    }
  }

  useEffect(() => {
    getAndSetReviews()
  }, [])

  const handleReviewDelete = async (reviewId) => {
    const confirmed = await confirm(
      "Are you sure you want to delete this review?"
    )
    if (confirmed) {
      await deleteReview(reviewId)
      toast.success("Review deleted")
      await getAndSetReviews()
    }
  }
  return (
    <div className="max-w-2xl mx-auto mt-10">
      <h2 className="text-2xl font-bold mb-6">
        {user.profile._id === viewedCustomer._id ||
        user._id === viewedCustomer._id
          ? "Your"
          : "Their"}{" "}
        Reviews
      </h2>

      {!sortedReviews || sortedReviews.length === 0 ? (
        <p className="text-gray-500">You have not left any reviews.</p>
      ) : (
        <>
          <SortBy
            options={sortOptions}
            items={reviews}
            onSorted={setSortedReviews}
            className="mb-4"
          />
          {sortedReviews.map((review) => (
            <ReviewCard
              key={review._id}
              review={review}
              currentRestaurant={review.restaurant}
              user={viewedCustomer}
              onDelete={handleReviewDelete}
              showRestaurant={true}
            />
          ))}
        </>
      )}
    </div>
  )
}

export default CustomerReviews
