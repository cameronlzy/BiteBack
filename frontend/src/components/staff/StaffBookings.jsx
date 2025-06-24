import React, { useEffect, useState } from "react"
import {
  getCurrentSlotReservations,
  updateReservationStatus,
} from "@/services/reservationService"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp } from "lucide-react"
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
  const [collapsed, setCollapsed] = useState(true)
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
        <Button
          variant="ghost"
          onClick={() => setCollapsed(!collapsed)}
          className="text-sm"
        >
          {collapsed ? (
            <>
              Show Bookings <ChevronDown className="ml-2 h-4 w-4" />
            </>
          ) : (
            <>
              Hide Bookings <ChevronUp className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>

      {!collapsed && (
        <>
          {loaded && bookings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No Current Bookings</p>
          ) : (
            bookings.map((b) => (
              <div
                key={b._id}
                className="border rounded-md p-4 mb-3 flex justify-between items-center"
              >
                <div>
                  {b.status === "event" ? (
                    <React.Fragment>
                      <p className="font-semibold">Booked By Owner</p>
                    </React.Fragment>
                  ) : (
                    <React.Fragment>
                      <p className="font-semibold">
                        Name:{String(b.user.name)}
                      </p>
                      <p className="font-semibold">
                        Number: {String(b.user.contactNumber)}
                      </p>
                    </React.Fragment>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Number of Guests: {b.pax}
                  </p>
                  <div className="mt-1">
                    <span
                      className={cn(
                        badgeVariants({ variant: "outline" }),
                        "rounded-full px-3",
                        statusColor[b.status] ||
                          "bg-muted text-muted-foreground"
                      )}
                    >
                      {b.status}
                    </span>
                  </div>
                </div>
                {b.status === "booked" && (
                  <div className="flex gap-2">
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
            ))
          )}
        </>
      )}
    </div>
  )
}

export default StaffBookings
