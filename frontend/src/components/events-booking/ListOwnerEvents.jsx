import { useEffect, useState } from "react"
import { useLocation, useNavigate, useSearchParams } from "react-router-dom"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { getOwnerEvents } from "@/services/eventService"
import Pagination from "@/components/common/Pagination"
import LoadingSpinner from "@/components/common/LoadingSpinner"
import { getCardMessageFromDescription } from "@/utils/stringRegexUtils"
import EventCard from "./EventCard"
import NoResultsFound from "../common/NoResultsFound"

const ListOwnerEvents = ({ user }) => {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)

  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()

  const page = parseInt(searchParams.get("page")) || 1
  const limit = 8
  const showUpcoming = searchParams.get("current") !== "false"

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

  const handlePageChange = (newPage) => {
    setSearchParams({ page: newPage, current: showUpcoming })
  }

  const toggleCurrent = (isCurrent) => {
    setSearchParams({ page: 1, current: isCurrent })
  }

  const totalPages = Math.ceil(totalCount / limit)

  return (
    <div>
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
        <NoResultsFound
          text={`No ${showUpcoming ? "current" : "past"} events.`}
        />
      ) : (
        <>
          <div className="space-y-4">
            {events.map((e) => (
              <EventCard
                key={e._id}
                _id={e._id}
                title={e.title}
                description={getCardMessageFromDescription(e.description)}
                bannerImage={e.bannerImage}
                startDate={e.startDate}
                endDate={e.endDate}
                restaurant={e.restaurant}
                status={e.status}
              />
            ))}
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

export default ListOwnerEvents
