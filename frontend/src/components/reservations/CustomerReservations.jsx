import { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { toast } from "react-toastify"
import { deleteReservation } from "@/services/reservationService"
import CalendarReservations from "./CalendarReservations"
import ListReservations from "./ListReservations"
import { Button } from "@/components/ui/button"
import { useConfirm } from "../common/ConfirmProvider"

const CustomerReservations = ({ user }) => {
  const [selectedDate, setSelectedDate] = useState(null)
  const [viewMode, setViewMode] = useState("list")

  const location = useLocation()
  const navigate = useNavigate()
  const confirm = useConfirm()

  const handleEdit = (reservationId, restaurantId) => {
    navigate(`/reservation/${restaurantId}/edit/${reservationId}`, {
      replace: true,
      state: { from: location.pathname },
    })
  }

  const handleDelete = async (reservationId) => {
    const confirmed = await confirm(
      `Are you sure you want to delete this booking?`
    )
    if (confirmed) {
      await deleteReservation(reservationId)
      toast.success(`Booking deleted!`)
      return "confirmed"
    } else {
      return "cancelled"
    }
  }

  return (
    <div className="max-w-3xl mx-auto mt-10">
      <div className="mb-6 flex flex-col items-center gap-2">
        <h2 className="text-2xl font-bold text-center">Manage Bookings</h2>
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

      {viewMode === "list" ? (
        <ListReservations
          user={user}
          onEdit={handleEdit}
          onDelete={handleDelete}
          showTag={(reservation) =>
            reservation.event ? "Event" : "Reservation"
          }
        />
      ) : (
        <>
          <CalendarReservations
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        </>
      )}
    </div>
  )
}

export default CustomerReservations
