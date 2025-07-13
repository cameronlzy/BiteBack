import React, { useEffect, useState } from "react"
import Calendar from "@/components/common/Calendar"
import CustomDay from "@/components/common/CustomDay"
import LoadingSpinner from "@/components/common/LoadingSpinner"
import { getOwnerEvents } from "@/services/eventService"
import { Button } from "@/components/ui/button"

const CalendarOwnerEvents = ({ user }) => {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(null)
  const [showUpcoming, setShowUpcoming] = useState(true)

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true)
      try {
        const res = await getOwnerEvents({
          page: 1,
          limit: 20,
          status: showUpcoming ? "upcoming" : "past",
        })
        setEvents(res.events || [])
      } catch (error) {
        console.error("Failed to load events:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchEvents()
  }, [user._id, showUpcoming])

  if (loading) return <LoadingSpinner size="md" />

  return (
    <div className="max-w-5xl mx-auto mt-10 px-4 text-center">
      <h2 className="text-2xl font-bold mb-6">Your Events (Calendar View)</h2>

      <div className="flex justify-center gap-4 mb-6">
        <Button
          variant={showUpcoming ? "default" : "outline"}
          onClick={() => setShowUpcoming(true)}
        >
          Current
        </Button>
        <Button
          variant={!showUpcoming ? "default" : "outline"}
          onClick={() => setShowUpcoming(false)}
        >
          Past
        </Button>
      </div>

      {events.length === 0 ? (
        <p className="text-gray-500">
          No {showUpcoming ? "upcoming" : "past"} events
        </p>
      ) : (
        <>
          <div className="flex justify-center">
            <Calendar
              selected={selectedDate}
              onSelect={setSelectedDate}
              components={{
                Day: (props) => (
                  <CustomDay
                    {...props}
                    existingItems={events}
                    updateDate={setSelectedDate}
                    type="Event"
                  />
                ),
              }}
              disabled={() => false}
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Displaying up to 20 {showUpcoming ? "upcoming" : "past"} scheduled
            events
          </p>
        </>
      )}
    </div>
  )
}

export default CalendarOwnerEvents
