import React, { useEffect, useState } from "react"
import {
  getCurrentSlotReservations,
  updateReservationStatus,
} from "@/services/reservationService"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { handle401 } from "@/utils/handleStaffTimeout"
import { badgeVariants } from "../ui/badge"
import { cn } from "@/lib/utils"

const statusColor = {
  booked: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  "no-show": "bg-red-100 text-red-800",
}

const StaffBookings = () => {
  const [bookings, setBookings] = useState([])
  const [loaded, setLoaded] = useState(false)
  const restaurantId = localStorage.getItem("restaurant")

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    try {
      const data = await getCurrentSlotReservations(restaurantId)
      setBookings(data)
    } catch (ex) {
      if (!(await handle401(ex))) {
        toast.error("Failed to fetch bookings")
      }
    } finally {
      setLoaded(true)
    }
  }

  const handleStatusUpdate = async (id, status) => {
    try {
      await updateReservationStatus(id, status)
      toast.success(`Marked as ${status}`)
      fetchBookings()
    } catch {
      toast.error("Failed to update booking")
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Current Time Slot Bookings</h1>
      </div>
      <>
        {loaded && bookings.length === 0 ? (
          <p className="text-sm text-muted-foreground">No Current Bookings</p>
        ) : (
          bookings.map((b) => (
            <div
              key={b._id}
              className="border rounded-md p-4 mb-3 flex justify-between items-start"
            >
              <div className="flex flex-col text-left space-y-1">
                {b.status === "event" ? (
                  <p className="font-semibold">Booked By Owner</p>
                ) : (
                  <>
                    <p className="font-semibold">Name: {b.user?.name}</p>
                    <p className="font-semibold">
                      Number: {b.user.contactNumber}
                    </p>
                  </>
                )}
                <p className="text-sm text-muted-foreground">
                  Number of Guests: {b.pax}
                </p>
                <span
                  className={cn(
                    badgeVariants({ variant: "outline" }),
                    "rounded-full px-3 w-fit",
                    statusColor[b.status] || "bg-muted text-muted-foreground"
                  )}
                >
                  {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                </span>
                <p className="text-sm text-muted-foreground">
                  Remarks: {b.remarks || "No remarks provided"}
                </p>
              </div>

              <div className="flex flex-col gap-2 items-center">
                {b.status === "booked" && (
                  <div>
                    <Button
                      size="sm"
                      onClick={() => handleStatusUpdate(b._id, "completed")}
                    >
                      Mark Completed
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleStatusUpdate(b._id, "no-show")}
                    >
                      Mark No-Show
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </>
    </div>
  )
}

export default StaffBookings
