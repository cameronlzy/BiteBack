import React, { useEffect, useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { toast } from "react-toastify"
import {
  getReservations,
  deleteReservation,
} from "@/services/reservationService"
import { getRestaurant } from "@/services/restaurantService"
import { useConfirm } from "../common/ConfirmProvider"
import CalendarReservations from "./CalendarReservations"
import ListReservations from "./ListReservations"
import { Button } from "@/components/ui/button"
import LoadingSpinner from "../common/LoadingSpinner"

const UserReservations = ({ user }) => {
  const [reservations, setReservations] = useState([])
  const [sortedReservations, setSortedReservations] = useState([])
  const [selectedDate, setSelectedDate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState("list")

  const location = useLocation()
  const navigate = useNavigate()
  const confirm = useConfirm()

  const isOwner = user?.role === "owner"
  const label = isOwner ? "Event" : "Reservation"
  const labelPlural = isOwner ? "Events" : "Reservations"

  const getAndSetReservations = async () => {
    try {
      const queriedReservations = await getReservations()
      const restaurantIds = queriedReservations.map((r) => r.restaurant)
      const restaurantData = await Promise.all(restaurantIds.map(getRestaurant))

      const merged = queriedReservations.map((res, idx) => ({
        ...res,
        restaurantName: restaurantData[idx]?.name || "",
        restaurantAddress: restaurantData[idx]?.address || "",
      }))

      setReservations(merged)
      setSortedReservations(merged)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getAndSetReservations()
  }, [])

  const handleEdit = (reservationId, restaurantId) => {
    navigate(`/reservation/${restaurantId}/edit/${reservationId}`, {
      replace: true,
      state: { from: location.pathname },
    })
  }

  const handleDelete = async (reservationId) => {
    const confirmed = await confirm(
      `Are you sure you want to delete this ${label.toLowerCase()}?`
    )
    if (confirmed) {
      await deleteReservation(reservationId)
      toast.success(`${label} deleted!`)
      await getAndSetReservations()
    }
  }

  return (
    <div className="max-w-3xl mx-auto mt-10">
      <div className="mb-6 flex flex-col items-center gap-2">
        <h2 className="text-2xl font-bold text-center">Manage {labelPlural}</h2>
        <Button
          className="text-sm px-3 py-1"
          variant="outline"
          onClick={() => {
            setViewMode((prev) => (prev === "list" ? "calendar" : "list"))
          }}
        >
          Switch to {viewMode === "list" ? "Calendar" : "List"} View
        </Button>
      </div>
      {loading ? (
        <LoadingSpinner size="md" />
      ) : reservations.length === 0 ? (
        <p className="text-gray-500">No Current {labelPlural}</p>
      ) : viewMode === "list" ? (
        <ListReservations
          reservations={reservations}
          sortedReservations={sortedReservations}
          setSortedReservations={setSortedReservations}
          user={user}
          onEdit={handleEdit}
          onDelete={handleDelete}
          label={label}
        />
      ) : (
        <CalendarReservations
          reservations={reservations}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          label={label}
        />
      )}
    </div>
  )
}

export default UserReservations
