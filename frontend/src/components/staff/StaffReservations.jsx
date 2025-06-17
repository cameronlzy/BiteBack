import React, { useEffect, useState } from "react"
import {
  getCurrentSlotReservations,
  updateReservationStatus,
} from "@/services/reservationService"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp } from "lucide-react"
import { handle401 } from "@/utils/handleStaffTimeout"

const StaffReservations = () => {
  const [reservations, setReservations] = useState([])
  const [collapsed, setCollapsed] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const restaurantId = localStorage.getItem("restaurant")

  useEffect(() => {
    fetchReservations()
  }, [])

  const fetchReservations = async () => {
    try {
      const data = await getCurrentSlotReservations(restaurantId)
      setReservations(data)
    } catch (ex) {
      if (!(await handle401(ex))) {
        toast.error("Failed to fetch reservations")
      }
    } finally {
      setLoaded(true)
    }
  }

  const handleStatusUpdate = async (id, status) => {
    try {
      await updateReservationStatus(id, status)
      toast.success(`Marked as ${status}`)
      fetchReservations()
    } catch (ex) {
      toast.error("Failed to update reservation")
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Current Time Slot Reservations</h1>
        <Button
          variant="ghost"
          onClick={() => setCollapsed(!collapsed)}
          className="text-sm"
        >
          {collapsed ? (
            <>
              Show Reservations <ChevronDown className="ml-2 h-4 w-4" />
            </>
          ) : (
            <>
              Hide Reservations <ChevronUp className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>

      {!collapsed && (
        <React.Fragment>
          {loaded && reservations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No Current Reservations
            </p>
          ) : (
            reservations.map((r) => (
              <div
                key={r._id}
                className="border rounded-md p-4 mb-3 flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold">{String(r.user)}</p>
                  {/* <p className="font-semibold">{r.name}</p>
                  <p className="font-semibold">{r.contactNumber}</p> */}
                  <p className="text-sm text-muted-foreground">
                    Status: {r.status}
                  </p>
                </div>
                {r.status === "booked" ? (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleStatusUpdate(r._id, "completed")}
                    >
                      Mark Completed
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleStatusUpdate(r._id, "no-show")}
                    >
                      Mark No-Show
                    </Button>
                  </div>
                ) : null}
              </div>
            ))
          )}
        </React.Fragment>
      )}
    </div>
  )
}

export default StaffReservations
