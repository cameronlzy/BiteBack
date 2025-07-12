import { useEffect, useState } from "react"
import { useParams, useNavigate, useLocation } from "react-router-dom"
import { toast } from "react-toastify"
import BackButton from "@/components/common/BackButton"
import LoadingSpinner from "@/components/common/LoadingSpinner"
import { useConfirm } from "@/components/common/ConfirmProvider"
import { getEventById, deleteEvent, saveEvent } from "@/services/eventService"
import { getCustomerVisitCount } from "@/services/restaurantService"
import { ownedByUserWithId, userIsOwner } from "@/utils/ownerCheck"
import { getRestaurant } from "@/services/restaurantService"
import RestaurantRelatedItemUI from "../common/RestaurantRelatedUI"
import { AlertTriangle, CalendarPlus } from "lucide-react"
import JoinEventForm from "./JoinEventForm"
import { hasItemStarted } from "@/utils/timeConverter"
import { activeCheck } from "@/utils/eventUtils"

const EventPage = ({ user }) => {
  const [event, setEvent] = useState(null)
  const [restaurant, setRestaurant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isOwnedByUser, setIsOwnedByUser] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [minVisitMessage, setMinVisitMessage] = useState(null)
  const confirm = useConfirm()
  const { eventId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [normalisedFrom, setNormalisedFrom] = useState(
    location.state?.from || "/restaurants"
  )

  useEffect(() => {
    const fetchEventAndRestaurant = async () => {
      try {
        const event = await getEventById(eventId)
        const restaurant = await getRestaurant(event?.restaurant)
        setEvent(event)
        setRestaurant(restaurant)
      } catch (ex) {
        if (ex.response?.status === 404 || ex.response?.status === 400) {
          toast.error("Event not found")
          navigate("/not-found")
          return
        }
        throw ex
      } finally {
        setLoading(false)
      }
    }
    fetchEventAndRestaurant()
  }, [eventId, user])

  useEffect(() => {
    const fetchVisitHistory = async () => {
      if (event?.minVisits) {
        if (!user || user.role !== "customer") {
          setMinVisitMessage(
            "Please log in as Customer to check if you can join this Member Event."
          )
          return
        }
        try {
          const { visitCount } = await getCustomerVisitCount(restaurant._id)
          console.log(visitCount)

          const shortfall = event.minVisits - visitCount
          if (shortfall > 0) {
            setMinVisitMessage(
              `You need ${shortfall} more visit${
                shortfall > 1 ? "s" : ""
              } to join this event.`
            )
          }
        } catch {
          toast.error("Failed to retrieve your visit count")
          setMinVisitMessage(
            "Unable to verify if you meet the visit requirement at the moment."
          )
        }
      }
    }
    fetchVisitHistory()
  }, [event?.minVisits, restaurant?._id, user])

  useEffect(() => {
    if (normalisedFrom.startsWith("/events") && event?.restaurant) {
      const segments = normalisedFrom.split("/")
      const eventEditString = segments[2]
      if (eventEditString === "edit") {
        setNormalisedFrom(
          userIsOwner(user) ? "/owner/events-promos" : "/events"
        )
      }
    }
    const isOwnedByUserCheck = ownedByUserWithId(event?.restaurant, user)
    setIsOwnedByUser(isOwnedByUserCheck)
  }, [event, normalisedFrom, user])

  const handleToggleCancel = async () => {
    if (event && DateTime.fromISO(event.startDate) < DateTime.now()) {
      toast.error("Cannot change Event Status once event has started")
      return
    }
    try {
      const updated = await saveEvent(restaurant?._id, {
        _id: event._id,
        status: event.status === "scheduled" ? "cancelled" : "scheduled",
      })
      toast.success(
        `Event ${activeCheck(updated.status) ? "Activated" : "Deactivated"}`
      )
      setEvent((prev) => ({
        ...prev,
        ...updated,
        restaurant: prev?.restaurant,
      }))
    } catch (ex) {
      toast.error("Failed to toggle promotion status")
      throw ex
    }
  }

  const handleDeleteEvent = async () => {
    if (
      event &&
      (DateTime.fromISO(event.startDate) < DateTime.now() ||
        event.reservedPax > 0)
    ) {
      toast.error(
        "Cannot Delete event once Event has started or Events has bookings"
      )
      return
    }
    const confirmed = await confirm(
      `Are you sure you want to delete the event "${event?.description}"?`
    )
    if (confirmed) {
      try {
        await deleteEvent(event.restaurant, event._id)
        toast.success("Event deleted")
        // Change navigation
        // navigate(`/current-events/${event.restaurant}`, { replace: true })
      } catch (ex) {
        toast.error("Failed to delete event")
        throw ex
      }
    }
  }

  const toggleJoinEvent = () => {
    if (!user) {
      toast.info("Please log in to join an event")
      navigate("/login", {
        replace: true,
        state: {
          from: location.pathname,
        },
      })
      return
    }
    setShowForm((prev) => !prev)
  }

  if (loading) {
    return (
      <div className="flex justify-center mt-20">
        <LoadingSpinner />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="text-center text-lg text-gray-500 mt-10">
        <div className="mt-4">
          <BackButton from={normalisedFrom} />
        </div>
        Reward not found.
      </div>
    )
  }

  const { _id, title, description, paxLimit, mainImage, status, reservedPax } =
    event

  const isActive = activeCheck(status)
  const hasStarted = hasItemStarted(event)
  return (
    <RestaurantRelatedItemUI
      type="Event"
      item={event}
      restaurant={restaurant}
      from={normalisedFrom}
      title={title}
      image={mainImage}
      description={description}
      onActivate={handleToggleCancel}
      currentlyActive={isActive}
      metaContent={
        <>
          <p className="text-base">
            Slots available: <strong>{paxLimit - reservedPax}</strong>
          </p>
          {event.minVisits > 0 && (
            <p className="text-sm text-gray-500">
              Minimum Visits to join: <strong>{event.minVisits}</strong>
            </p>
          )}
          {minVisitMessage && user?.role !== "owner" && (
            <p className="text-sm text-red-500">{minVisitMessage}</p>
          )}
        </>
      }
      isOwnedByUser={isOwnedByUser}
      onEdit={() =>
        navigate(`/events/edit/${_id}`, {
          state: { from: location.pathname },
        })
      }
      onDelete={!hasStarted && reservedPax === 0 ? handleDeleteEvent : null}
      action={
        user?.role === "customer" && isActive
          ? {
              onClick: toggleJoinEvent,
              icon: <CalendarPlus className="w-5 h-5" />,
              label: showForm ? "Cancel Join" : "Join Event",
              disabled: !!minVisitMessage,
            }
          : null
      }
      banner={
        !isActive ? (
          <div className="bg-gray-100 text-gray-800 border-t-4 border-gray-400 px-4 py-3 flex items-center justify-between rounded-t-md">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">
                This event is currently cancelled
              </span>
            </div>
          </div>
        ) : null
      }
      form={showForm ? <JoinEventForm event={event} user={user} /> : null}
    />
  )
}

export default EventPage
