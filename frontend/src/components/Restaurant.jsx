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
import { useEffect, useState } from "react"
import { useConfirm } from "./common/ConfirmProvider"
import { toast } from "react-toastify"
import ReviewSection from "./reviews/ReviewSection"
import { Calendar, Settings, Star, Store, Users } from "lucide-react"
import LoadingSpinner from "./common/LoadingSpinner"
import { DropdownMenu, DropdownMenuItem } from "./ui/dropdown-menu"
import {
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu"
import StarRating from "./common/StarRating"
import BackButton from "./common/BackButton"
import { isWithinOpeningHours } from "@/utils/timeConverter"
import defaultRestImg from "@/assets/default-restaurant-img.png"

const Restaurant = ({ user }) => {
  const { id } = useParams()
  const navigate = useNavigate()
  const confirm = useConfirm()
  const location = useLocation()
  let from = location?.state?.from || "/restaurants"

  if (
    (from?.startsWith("/online-queue/") || from?.startsWith("/reservation/")) &&
    from?.split("/")[2] === id
  ) {
    from = "/restaurants"
  }

  const [restaurant, setRestaurant] = useState(null)
  const [showReviewForm, setShowReviewForm] = useState(false)
  console.log(user)
  console.log(restaurant)
  const isOwnedByUser = restaurant?.owner === user?._id
  const imageShow = location.state?.imageShow
  useEffect(() => {
    if (sessionStorage.getItem("restaurant_cache") && imageShow) {
      const cached = sessionStorage.getItem("restaurant_cache")
      const parsed = JSON.parse(cached)
      setRestaurant(parsed)
      return
    }

    const fetchRestaurant = async () => {
      try {
        const queriedRestaurant = await getRestaurant(id)
        sessionStorage.setItem(
          "restaurant_cache",
          JSON.stringify(queriedRestaurant)
        )
        setRestaurant(queriedRestaurant)
      } catch (ex) {
        if (ex.response?.status === 404 || ex.response?.status === 400) {
          toast.error("Restaurant not found")
          navigate("/not-found")
        }
      }
    }

    fetchRestaurant()
  }, [id])

  const handleRestaurantDelete = async (id) => {
    const confirmed = await confirm(
      `Are you sure you want to delete the restaurant ${restaurant.name}?`
    )
    if (confirmed) {
      await deleteRestaurant(id)
      toast.success("Deleted")
      window.location = "/restaurants"
    }
  }

  const handleToggleReviewForm = () => {
    if (!user) {
      toast.info("Please log in first")
      return navigate("/login", {
        state: { from: location.pathname },
        replace: true,
      })
    }
    setShowReviewForm((prev) => !prev)
  }

  if (!restaurant) return <LoadingSpinner />

  const {
    _id: restid,
    name,
    description,
    address,
    images,
    contactNumber,
    email,
    website,
    cuisines,
    maxCapacity,
    openingHours,
    tags,
  } = restaurant

  return (
    <div className="w-full max-w-4xl mx-auto mt-6 px-4">
      <BackButton from={from} />
      <div className="relative w-full h-64 rounded-xl overflow-hidden shadow-md">
        <Link
          to={`/images/${encodeURIComponent(images?.[0])}`}
          className="block w-full h-full"
          state={{ from: location.pathname }}
        >
          <img
            src={images?.length > 0 ? images[0] : defaultRestImg}
            alt={name}
            className="w-full h-full object-cover"
            onError={(ex) => {
              ex.target.onerror = null
              ex.target.src = defaultRestImg
            }}
          />
          <div className="absolute inset-0 bg-black/40 p-4 flex flex-col justify-end items-start space-y-2">
            <h1 className="text-3xl font-bold text-white text-left">{name}</h1>
            <div className="flex items-center gap-2">
              <div className="bg-white/20 px-2 py-1 rounded flex items-center">
                <StarRating rating={restaurant?.averageRating} />
                <span className="ml-2 text-sm text-white font-medium">
                  {restaurant?.averageRating.toFixed(1)} (
                  {restaurant?.reviewCount === 1
                    ? `${restaurant?.reviewCount || 0} review`
                    : `${restaurant?.reviewCount || 0} reviews`}
                  )
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-sm text-white font-medium">
              {cuisines.slice(0, 3).map((cuisine) => (
                <span
                  key={cuisine}
                  className="bg-white/20 px-2 py-1 rounded backdrop-blur-sm"
                >
                  {cuisine}
                </span>
              ))}

              {tags.length > 0 &&
                tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-white/20 px-2 py-1 rounded backdrop-blur-sm"
                  >
                    {tag}
                  </span>
                ))}
            </div>
          </div>
        </Link>
        {isOwnedByUser && (
          <div className="absolute top-2 right-2 z-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-white/20 hover:bg-white/30 text-white"
                >
                  <Settings className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="w-40 bg-white/50 backdrop-blur-sm shadow-lg rounded-md"
              >
                <DropdownMenuItem
                  className="hover:bg-gray-100 text-gray-800"
                  onClick={() => navigate("/restaurants/edit/" + id)}
                >
                  Edit Restaurant
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleRestaurantDelete(id)}
                  className="text-red-600 hover:bg-red-50 focus:bg-red-100 focus:text-red-700 font-medium"
                >
                  Delete Restaurant
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
      {images?.length > 1 && (
        <Card className="mt-6 shadow-sm">
          <CardHeader className="h-0">
            <CardTitle>Gallery</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {images.slice(1, 5).map((imgUrl, index) => (
                <Link
                  key={index}
                  to={`/images/${encodeURIComponent(imgUrl)}`}
                  state={{ from: location.pathname }}
                >
                  <img
                    src={imgUrl}
                    alt={`Gallery ${index + 1}`}
                    className="w-35 h-35 object-cover rounded-md border hover:opacity-90 transition-opacity"
                  />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
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
          </div>

          <div className="mt-6 flex gap-4 justify-center">
            {(!user || user.role === "customer" || isOwnedByUser) && (
              <Link
                to={`/reservation/${restid}`}
                state={{ from: location.pathname }}
                className="group"
              >
                <Button
                  className={`bg-black text-white h-11 w-11 ${
                    isOwnedByUser
                      ? "group-hover:w-[140px]"
                      : "group-hover:w-[180px]"
                  } transition-all duration-300 ease-in-out rounded-full overflow-hidden shadow flex items-center gap-2 px-0.75`}
                >
                  <div
                    className="flex items-center justify-left group-hover:justify-start 
                  w-full 
                  px-3
                  transition-all 
                  duration-300"
                  >
                    <Calendar className="w-5 h-5" />
                    <span
                      className="ml-2 opacity-0 group-hover:opacity-100 
                    transition-opacity 
                    duration-300 
                    whitespace-nowrap"
                    >
                      {isOwnedByUser ? "Book Event" : "Make Reservation"}
                    </span>
                  </div>
                </Button>
              </Link>
            )}
            <Link
              to={`/online-queue/${restid}`}
              state={{ from: location.pathname }}
              className="group"
              onClick={(e) =>
                (!isWithinOpeningHours(openingHours) ||
                  !restaurant.queueEnabled) &&
                e.preventDefault()
              }
            >
              <Button
                className={`bg-white text-black h-11 px-3 w-11 group-hover:w-[140px]
                hover:bg-gray-100 
                transition-all 
                duration-300 
                ease-in-out 
                rounded-full 
                overflow-hidden 
                shadow 
                flex 
                items-center 
                justify-start 
                gap-2
                ${
                  !isWithinOpeningHours(openingHours)
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                disabled={
                  !isWithinOpeningHours(openingHours) ||
                  !restaurant.queueEnabled
                }
              >
                <Users className="w-5 h-5" />
                <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                  View Queue
                </span>
              </Button>
            </Link>
            <Link
              to={`/current-rewards/${restid}`}
              state={{ from: location.pathname }}
              className="group"
            >
              <Button
                className="bg-indigo-600 text-white h-11 w-11 group-hover:w-[140px]
              hover:bg-indigo-700 
                transition-all 
                duration-300 
                ease-in-out 
                rounded-full 
                overflow-hidden 
                shadow 
                flex 
                items-center 
                justify-start 
                gap-2"
              >
                <Store className="w-5 h-5" />
                <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                  View Rewards
                </span>
              </Button>
            </Link>
            {user?.role !== "owner" && (
              <div className="group">
                <Button
                  onClick={handleToggleReviewForm}
                  className={`bg-yellow-400 hover:bg-yellow-500 text-black h-11 w-11 ${
                    showReviewForm
                      ? "group-hover:w-[100px]"
                      : "group-hover:w-[160px]"
                  }
                    transition-all 
                    duration-300 
                    ease-in-out 
                    rounded-full 
                    overflow-hidden 
                    shadow 
                    flex 
                    items-center 
                    gap-2 
                    px-0.75 group`}
                >
                  <div
                    className="flex items-center justify-left group-hover:justify-start 
                    w-full 
                    px-3 
                    transition-all 
                    duration-300"
                  >
                    <Star className="w-5 h-5" />
                    <span
                      className="ml-2 opacity-0 group-hover:opacity-100  
                    transition-opacity 
                    duration-300 
                    whitespace-nowrap"
                    >
                      {showReviewForm ? "Cancel" : "Leave a Review"}
                    </span>
                  </div>
                </Button>
              </div>
            )}
          </div>

          <ReviewSection
            restaurant={restaurant}
            user={user}
            showRestaurant={false}
            showReviewForm={showReviewForm}
            setShowReviewForm={setShowReviewForm}
          />
        </CardContent>
      </Card>
    </div>
  )
}

export default Restaurant
