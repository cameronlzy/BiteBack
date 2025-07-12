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
import TransactionCard from "@/components/common/TransactionCard"
import { activeCheck } from "@/utils/eventUtils"
import { getRestaurant } from "@/services/restaurantService"
import LoadingSpinner from "../common/LoadingSpinner"
import { Crown } from "lucide-react"
import { getCardMessageFromDescription } from "@/utils/stringRegexUtils"

const MembersEvents = () => {
  const { restaurantId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const [events, setEvents] = useState([])
  const [restaurant, setRestaurant] = useState(null)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()
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
      <h2 className="text-3xl font-bold text-center flex items-center justify-center gap-2">
        <Crown className="w-6 h-6" />
        Member Events by {restaurant?.name}
      </h2>
      {events.length === 0 ? (
        <div className="text-center py-10 text-gray-500 italic">
          No member events found.
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {events.map((e) => (
            <TransactionCard
              key={e._id}
              _id={e._id}
              name={e.title}
              description={getCardMessageFromDescription(e.description)}
              image={e.bannerImage}
              date={e.startDate}
              disabled={!activeCheck(e.status)}
              disabledMessage="Event is currently cancelled"
              clickMessage="Find out more"
              onClick={() =>
                navigate(`/events/${e._id}`, {
                  state: {
                    from: location.pathname,
                  },
                })
              }
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
