import { useEffect, useState } from "react"
import { useLocation, useNavigate, useSearchParams } from "react-router-dom"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import TransactionCard from "@/components/common/TransactionCard"
import { getOwnerEvents } from "@/services/eventService"
import Pagination from "@/components/common/Pagination"
import LoadingSpinner from "@/components/common/LoadingSpinner"
import { getRestaurant } from "@/services/restaurantService"

const OwnerEvents = ({ user }) => {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)

  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()

  const page = parseInt(searchParams.get("page")) || 1
  const limit = 8
  const showUpcoming = searchParams.get("current") !== "false"
  const [enrichedEvents, setEnrichedEvents] = useState([])

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true)
      try {
        const response = await getOwnerEvents({
          page,
          limit,
          status: showUpcoming ? "upcoming" : "past",
        })
        setEvents(response.events || [])
        setTotalCount(response.totalCount || 0)
      } catch (ex) {
        toast.error("Failed to fetch owner events")
        console.error(ex)
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [user._id, page, showUpcoming])

  useEffect(() => {
    const fetchEnrichedEvents = async () => {
      const eventsWithRestaurant = await Promise.all(
        events.map(async (e) => {
          let restaurantName = ""
          try {
            const restaurant = await getRestaurant(e.restaurant)
            restaurantName = restaurant?.name || ""
          } catch {
            restaurantName = ""
          }
          return { ...e, restaurantName }
        })
      )
      console.log(eventsWithRestaurant)
      setEnrichedEvents(eventsWithRestaurant)
    }

    if (events.length > 0) fetchEnrichedEvents()
  }, [events])

  const handlePageChange = (newPage) => {
    setSearchParams({ page: newPage, current: showUpcoming })
  }

  const toggleCurrent = (isCurrent) => {
    setSearchParams({ page: 1, current: isCurrent })
  }

  const totalPages = Math.ceil(totalCount / limit)

  return (
    <div className="max-w-5xl mx-auto mt-10 px-4">
      <h2 className="text-2xl font-bold mb-6">Your Events</h2>

      <div className="flex gap-4 mb-4">
        <Button
          variant={showUpcoming ? "default" : "outline"}
          onClick={() => toggleCurrent(true)}
        >
          Current
        </Button>
        <Button
          variant={!showUpcoming ? "default" : "outline"}
          onClick={() => toggleCurrent(false)}
        >
          Past
        </Button>
        <Button
          className="ml-auto"
          onClick={() =>
            navigate("/events/new", {
              state: {
                from: location.pathname,
              },
            })
          }
        >
          Create New Event
        </Button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : events.length === 0 ? (
        <p className="text-gray-500">
          No {showUpcoming ? "current" : "past"} events
        </p>
      ) : (
        <>
          <div className="space-y-4">
            <div className="space-y-4">
              {enrichedEvents.map((e) => (
                <TransactionCard
                  key={e._id}
                  _id={e._id}
                  name={`${e.title || "Event"}${
                    e.restaurantName ? ` @ ${e.restaurantName}` : ""
                  }`}
                  date={e.startDate}
                  description={e.description}
                  image={e.bannerImage}
                  onClick={() =>
                    navigate(`/events/${e._id}`, {
                      replace: true,
                      state: {
                        from: location.pathname,
                      },
                    })
                  }
                  clickMessage="View Event Details"
                  disabled={!showUpcoming}
                  disabledMessage={!showUpcoming ? "This event has ended" : ""}
                />
              ))}
            </div>
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalCount={totalCount}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  )
}

export default OwnerEvents
