import React, { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { DateTime } from "luxon"
import { readableTimeSettings } from "@/utils/timeConverter"
import { getReservations } from "@/services/reservationService"
import { getRestaurant } from "@/services/restaurantService"
import Pagination from "@/components/common/Pagination"
import LoadingSpinner from "../common/LoadingSpinner"
import { Link, useLocation } from "react-router-dom"

const ListReservations = ({ user, onEdit, onDelete, showTag }) => {
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const location = useLocation()

  const fetchReservations = async () => {
    try {
      setLoading(true)
      const response = await getReservations({ page, limit: 8 })
      const queriedReservations = response.reservations || []
      console.log(queriedReservations)

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

  if (loading) return <LoadingSpinner size="md" />

  if (reservations.length === 0)
    return <p className="text-gray-500">No current bookings.</p>

  return (
    <>
      {reservations.map((res, index) => (
        <Card key={index} className="mb-4 shadow">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Booking Details</span>
              {!res.event && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(res._id, res.restaurant)}
                >
                  Edit Details
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-gray-700">
            {res.event && (
              <Link
                to={`/events/${res.event._id}`}
                state={{ from: location.pathname }}
                className="text-blue-800 text-base hover:underline font-medium"
              >
                {res.event.title}
              </Link>
            )}
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              <strong>Phone:</strong> {user.profile.contactNumber || "-"}
            </p>
            <p>
              <strong>Start Date & Time:</strong>{" "}
              {DateTime.fromISO(res.startDate).toLocaleString(
                readableTimeSettings
              )}
            </p>
            <p>
              <strong>End Date & Time:</strong>{" "}
              {DateTime.fromISO(res.endDate).toLocaleString(
                readableTimeSettings
              )}
            </p>
            <p>
              <strong>Guests:</strong> {res.pax}
            </p>
            <p>
              <strong>Restaurant:</strong> {res.restaurantName} @{" "}
              {res.restaurantAddress}
            </p>
            <p>
              <strong>Remarks:</strong> {res.remarks || "-"}
            </p>
            <div>
              <span
                className={`inline-block text-xs font-medium px-2 py-1 rounded-full ${
                  showTag(res) === "Event"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {showTag(res)}
              </span>
            </div>
            {DateTime.fromISO(res.startDate) > DateTime.local() && (
              <Button
                className="text-red-600 hover:bg-red-100 transition-colors"
                variant="ghost"
                onClick={() => onDelete(res._id)}
              >
                <Trash2 className="w-5 h-5" />
                Delete Booking
              </Button>
            )}
          </CardContent>
        </Card>
      ))}

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
