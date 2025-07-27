import React, { useEffect, useState } from "react"
import {
  getCurrentSlotReservations,
  updateReservationStatus,
} from "@/services/reservationService"
import { toast } from "react-toastify"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { handle401 } from "@/utils/handleStaffTimeout"
import BookingCard from "./BookingCard"
import LoadingSpinner from "../common/LoadingSpinner"

const StaffBookings = () => {
  const [bookings, setBookings] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [activeTab, setActiveTab] = useState("reservations")
  const restaurantId = localStorage.getItem("restaurant")

  useEffect(() => {
    fetchBookings(activeTab === "events")
  }, [activeTab])

  const fetchBookings = async (isEvent) => {
    try {
      setLoaded(false)
      const data = await getCurrentSlotReservations(restaurantId, {
        event: isEvent,
      })
      setBookings(data || [])
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
      fetchBookings(activeTab === "events")
    } catch {
      toast.error("Failed to update booking")
    }
  }

  if (!loaded) return <LoadingSpinner />

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Current Time Slot Bookings</h1>

      <Tabs
        defaultValue="reservations"
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="reservations">Reservations</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
        </TabsList>

        <TabsContent value="reservations">
          {loaded && bookings.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No Current Reservations
            </p>
          ) : (
            bookings.map((b) => (
              <BookingCard
                key={b._id}
                booking={b}
                onStatusUpdate={handleStatusUpdate}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="events">
          {loaded && bookings.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No Current Event Bookings
            </p>
          ) : (
            bookings.map((b) => (
              <BookingCard
                key={b._id}
                booking={b}
                onStatusUpdate={handleStatusUpdate}
                eventTitle={b?.event?.title}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default StaffBookings
