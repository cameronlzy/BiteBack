import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { DateTime } from "luxon"
import { readableTimeSettings } from "@/utils/timeConverter"
import SortBy from "./common/SortBy"

const ListReservations = ({
  reservations,
  sortedReservations,
  setSortedReservations,
  user,
  onEdit,
  onDelete,
}) => {
  const sortOptions = [
    { label: "Date & Time", value: "reservationDate" },
    { label: "Guests", value: "pax" },
    { label: "Restaurant", value: "restaurantName" },
  ]

  return (
    <>
      <SortBy
        options={sortOptions}
        items={reservations}
        onSorted={setSortedReservations}
        className="mb-4"
      />
      {sortedReservations.map((res, index) => (
        <Card key={index} className="mb-4 shadow">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Reservation Details</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(res._id, res.restaurant)}
              >
                Edit Details
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-gray-700">
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              <strong>Phone:</strong> {user.profile.contactNumber || "-"}
            </p>
            <p>
              <strong>Date & Time:</strong>{" "}
              {DateTime.fromISO(res.reservationDate).toLocaleString(
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
            <Button
              className="text-red-600 hover:bg-red-100 transition-colors"
              variant="ghost"
              onClick={() => onDelete(res._id)}
            >
              <Trash2 className="w-5 h-5" />
              Delete Reservation
            </Button>
          </CardContent>
        </Card>
      ))}
    </>
  )
}

export default ListReservations
