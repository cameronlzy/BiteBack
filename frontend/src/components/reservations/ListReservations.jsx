import React, { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Calendar,
  Clock,
  MapPin,
  MessageSquare,
  Pen,
  Trash2,
  User,
} from "lucide-react"
import { DateTime } from "luxon"
import { getReservations } from "@/services/reservationService"
import { getRestaurant } from "@/services/restaurantService"
import Pagination from "@/components/common/Pagination"
import LoadingSpinner from "../common/LoadingSpinner"
import NoResultsFound from "../common/NoResultsFound"

const ListReservations = ({ onEdit, onDelete, showTag }) => {
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchReservations = async () => {
    try {
      setLoading(true)
      const response = await getReservations({ page, limit: 8 })
      const queriedReservations = response.reservations || []

      const restaurantIds = queriedReservations.map((r) => r.restaurant)
      const restaurantData = await Promise.all(
        restaurantIds.map((id) => getRestaurant(id).catch(() => null))
      )

      const merged = queriedReservations.map((res, i) => ({
        ...res,
        restaurantName: restaurantData[i]?.name || "",
        restaurantAddress: restaurantData[i]?.address || "",
      }))

      setReservations(merged)
      setTotalPages(response.totalPages || 1)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReservations()
  }, [page])

  const handleDelete = async (id) => {
    const response = await onDelete(id)
    if (response === "confirmed") {
      setReservations((prev) => prev.filter((res) => res._id !== id))
    }
  }

  if (loading) return <LoadingSpinner size="md" />

  if (reservations.length === 0)
    return <NoResultsFound text="No current bookings." />

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {reservations.map((res, index) => (
          <Card
            key={index}
            className="shadow p-4 flex flex-col justify-between"
          >
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-center gap-2 font-semibold text-base">
                <Calendar className="w-4 h-4" />
                {res.event?.title || "Reservation Details"}
              </div>

              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                {DateTime.fromISO(res.startDate).toFormat("DDD")} (
                {DateTime.fromISO(res.startDate).toFormat("h:mm a")} -{" "}
                {DateTime.fromISO(res.endDate).toFormat("h:mm a")})
              </div>

              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-500" />
                {res.pax} {res.pax > 1 ? "Guests" : "Guest"}
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                {res.restaurantName}
              </div>

              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-gray-500" />
                {res.remarks ? (
                  <span>{res.remarks}</span>
                ) : (
                  <span className="italic text-gray-500">No Remarks</span>
                )}
              </div>
            </div>

            <div className="mt-0 flex items-end justify-between">
              <span
                className={`text-xs font-medium px-2 py-1 rounded-full ${
                  res.status === "cancelled"
                    ? "bg-orange-100 text-orange-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {res.status === "cancelled" ? "Cancelled" : showTag(res)}
              </span>

              <div className="flex space-x-2">
                {!res.event && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="border"
                    onClick={() => onEdit(res._id, res.restaurant)}
                  >
                    <Pen className="w-4 h-4" />
                  </Button>
                )}
                {DateTime.fromISO(res.startDate) > DateTime.local() && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="border"
                    onClick={() => handleDelete(res._id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex justify-center mt-6">
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalCount={reservations.length}
          onPageChange={setPage}
        />
      </div>
    </>
  )
}

export default ListReservations
