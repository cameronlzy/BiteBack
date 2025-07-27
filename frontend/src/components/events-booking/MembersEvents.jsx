import React, { useEffect, useState } from "react"
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom"
import { toast } from "react-toastify"
import { getEventsByRestaurant } from "@/services/eventService"
import Pagination from "@/components/common/Pagination"
import { getRestaurant } from "@/services/restaurantService"
import LoadingSpinner from "../common/LoadingSpinner"
import { Crown } from "lucide-react"
import { getCardMessageFromDescription } from "@/utils/stringRegexUtils"
import EventCard from "./EventCard"
import NoResultsFound from "../common/NoResultsFound"
import BackButton from "../common/BackButton"

const MembersEvents = () => {
  const { restaurantId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const [events, setEvents] = useState([])
  const [restaurant, setRestaurant] = useState(null)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(false)
  const location = useLocation()
  const from = location.state?.from || `/restaurants/${restaurantId}`

  const navigate = useNavigate()
  const page = parseInt(searchParams.get("page") || "1", 10)

  useEffect(() => {
    const fetchMemberEvents = async () => {
      try {
        setLoading(true)
        const restaurant = await getRestaurant(restaurantId)
        const response = await getEventsByRestaurant(restaurantId, {
          page,
          limit: 8,
        })
        setRestaurant(restaurant)
        setEvents(response.events || [])
        setTotalCount(response.totalCount || 0)
        setTotalPages(response.totalPages || 0)
      } catch (ex) {
        if (ex.response?.status === 404 || ex.response?.status == 400) {
          toast.error("Restaurant not found")
          navigate("/not-found", { replace: true })
        } else {
          toast.error("Failed to load events")
          throw ex
        }
      } finally {
        setLoading(false)
      }
    }

    fetchMemberEvents()
  }, [restaurantId, page])

  if (loading) return <LoadingSpinner />

  return (
    <div className="max-w-6xl mx-auto my-10 px-4 space-y-6">
      <BackButton from={from} />
      <h2 className="text-3xl font-bold text-center flex items-center justify-center gap-2">
        <Crown className="w-6 h-6" />
        Member Events by {restaurant?.name}
      </h2>
      {events.length === 0 ? (
        <NoResultsFound text="No member events found." />
      ) : (
        <div className="flex flex-col gap-6">
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
      )}
      <div className="flex justify-center">
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalCount={totalCount}
          onPageChange={(newPage) => {
            setSearchParams({ page: newPage.toString() })
          }}
        />
      </div>
    </div>
  )
}

export default MembersEvents
