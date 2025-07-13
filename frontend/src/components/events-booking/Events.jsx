import React, { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { getEvents } from "@/services/eventService"
import Pagination from "@/components/common/Pagination"
import { toast } from "react-toastify"
import { getCardMessageFromDescription } from "@/utils/stringRegexUtils"
import LoadingSpinner from "../common/LoadingSpinner"
import EventCard from "./EventCard"

const Events = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [events, setEvents] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(false)
  const page = parseInt(searchParams.get("page") || "1", 10)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true)
        const response = await getEvents({ page, limit: 8 })
        setEvents(response.events || [])
        setTotalCount(response.totalCount || 0)
        setTotalPages(response.totalPages || 0)
      } catch (ex) {
        console.error(ex)
        toast.error("Failed to load events.")
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [page])

  if (loading) return <LoadingSpinner />

  return (
    <div className="max-w-6xl mx-auto my-10 px-4 space-y-6">
      <h2 className="text-3xl font-bold text-center">Events</h2>

      {events.length === 0 ? (
        <div className="text-center py-10 text-gray-500 italic">
          No events found.
        </div>
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
            setSearchParams({
              page: newPage.toString(),
            })
          }}
        />
      </div>
    </div>
  )
}

export default Events
