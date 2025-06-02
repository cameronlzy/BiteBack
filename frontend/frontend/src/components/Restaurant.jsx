import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Link, useNavigate, useParams, useLocation } from "react-router-dom"
import { deleteRestaurant, getRestaurant } from "@/services/restaurantService"
import { getRestaurantReservations } from "@/services/reservationService"
import { useEffect, useState } from "react"
import { useConfirm } from "./common/ConfirmProvider"
import { toast } from "react-toastify"
import { DateTime } from "luxon"
import { readableTimeSettings } from "@/utils/timeConverter"
import ReviewSection from "./ReviewSection"
import { Trash2 } from "lucide-react"

const Restaurant = ({ user }) => {
  const { id } = useParams()
  const navigate = useNavigate()
  const confirm = useConfirm()
  const location = useLocation()

  const [restaurant, setRestaurant] = useState(null)
  const [availableCapacity, setAvailableCapacity] = useState(null)
  const isOwnedByUser = user?.role == "owner" && user._id === restaurant?.owner

  const [reservations, setReservations] = useState(null)

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const queriedRestaurant = await getRestaurant(id)
        setRestaurant(queriedRestaurant)
      } catch (ex) {
        if (
          (ex.response && ex.response.status === 404) ||
          ex.response.status === 400
        ) {
          navigate("/not-found", { replace: true })
          return
        }
        toast.error("Failed to fetch restaurant details")
      }
    }
    fetchRestaurant()
  }, [id, navigate])

  useEffect(() => {
    const fetchReservations = async () => {
      if (isOwnedByUser && restaurant) {
        const today = new Date().toISOString().split("T")[0]
        const res = await getRestaurantReservations(restaurant._id, today)
        const enriched = res.map((r) => ({
          ...r,
          user: user,
        }))

        setReservations(enriched)
      }
    }
    fetchReservations()
  }, [restaurant, user, isOwnedByUser])

  const handleRestaurantDelete = async (id) => {
    const confirmed = await confirm(
      `Are you sure you want to delete the restaurant ${restaurant.name}?`
    )
    if (confirmed) {
      await deleteRestaurant(id)
      toast.success("Deleted!")
      navigate("/restaurants", { replace: true })
    }
  }

  if (!restaurant)
    return <p className="text-center mt-10">Loading restaurant...</p>

  const {
    _id: restid,
    name,
    description,
    address,
    imageUrl,
    contactNumber,
    email,
    website,
    cuisines,
    maxCapacity,
    openingHours,
  } = restaurant
  return (
    <div className="w-full max-w-4xl mx-auto mt-6 px-4">
      <div className="relative w-full h-64 rounded-xl overflow-hidden shadow-md">
        <img
          src={
            imageUrl
              ? imageUrl
              : "https://www.opentable.com/img/restimages/2038.jpg"
          }
          alt={name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40 flex items-end p-4">
          <h1 className="text-3xl font-bold text-white ">{name}</h1>
        </div>
      </div>
      {isOwnedByUser && (
        <Button
          className="mt-4"
          onClick={() => navigate("/restaurants/edit/" + id)}
        >
          Edit Restaurant
        </Button>
      )}

      <Card className="mt-6 shadow-sm">
        <CardHeader>
          <CardTitle>Restaurant Details</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-gray-700 text-sm">
          <div className="flex flex-col md:flex-row text-sm text-gray-700">
            <div className="flex-1 space-y-3">
              <div>
                <strong className="block text-gray-900">Address:</strong>
                {address}
              </div>
              <div>
                <strong className="block text-gray-900">Contact Number:</strong>
                {contactNumber || "-"}
              </div>
              <div>
                <strong className="block text-gray-900">Email:</strong>
                {email || "-"}
              </div>
              <div>
                <strong className="block text-gray-900">Website:</strong>
                {website ? (
                  <a
                    href={website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    {website}
                  </a>
                ) : (
                  "-"
                )}
              </div>
              <div>
                <strong className="block text-gray-900">Cuisines:</strong>
                {cuisines?.length > 0 ? cuisines.join(", ") : "-"}
              </div>
              <div>
                <strong className="block text-gray-900">Max Capacity:</strong>
                {maxCapacity}
              </div>
            </div>

            <div className="flex-1">
              <strong className="block text-gray-900 mb-2">
                Opening Hours:
              </strong>
              <ul className="space-y-1">
                {openingHours &&
                  Object.entries(openingHours).map(([day, hours]) => (
                    <li key={day} className="capitalize">
                      {day}: {hours}
                    </li>
                  ))}
              </ul>
            </div>
            {availableCapacity !== null && (
              <div className="mt-4">
                <span className="inline-block bg-green-100 text-green-800 text-sm font-semibold px-4 py-1 rounded-full">
                  Live Availability: {availableCapacity} seats left today
                </span>
              </div>
            )}
          </div>

          <div className="mt-6">
            <Link
              to={`/reservation/${restid}`}
              state={{ from: location.pathname }}
            >
              <Button
                className="w-[180px] h-11 bg-black 
             hover:bg-gray-800 
             text-white 
             font-semibold 
             rounded-full 
             px-6 
             py-2 
             transition-colors 
             duration-300 
             shadow"
              >
                Make a Reservation
              </Button>
            </Link>
          </div>
          {isOwnedByUser && (
            <Button
              className="text-red-600 hover:bg-red-100 transition-colors"
              variant="ghost"
              onClick={() => handleRestaurantDelete(id)}
            >
              <Trash2 className="w-5 h-5" />
              Delete Restaurant
            </Button>
          )}
          <ReviewSection restaurant={restaurant} user={user} />
          {isOwnedByUser && (
            <CardContent className="space-y-4">
              <hr className="my-6 border-t border-gray-300" />
              <h4 className="text-lg font-semibold">Upcoming Reservations</h4>
              {!reservations ? (
                <p className="text-gray-500">Loading reservations...</p>
              ) : reservations.length === 0 ? (
                <p className="text-gray-500">No upcoming reservations.</p>
              ) : (
                <div className="space-y-3">
                  {reservations.map((res, index) => (
                    <Card key={index} className="mb-4 shadow">
                      <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                          Reservation Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-1 text-sm text-gray-700">
                        <p>
                          <strong>Email:</strong> {res.user?.email}
                        </p>
                        <p>
                          <strong>Phone:</strong>{" "}
                          {res.user?.profile.contactNumber || "-"}
                        </p>
                        <p>
                          <strong>Date & Time:</strong>{" "}
                          {DateTime.fromISO(res.reservationDate).toLocaleString(
                            readableTimeSettings
                          )}
                        </p>
                        <p>
                          <strong>Guests:</strong> {res.pax}
                        </p>
                        <p>
                          <strong>Restaurant:</strong> {restaurant.name} @{" "}
                          {restaurant.address}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Restaurant
