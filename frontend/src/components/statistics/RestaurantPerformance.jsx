import ReservationTrends from "./ReservationTrends"
import ReviewTrends from "./ReviewTrends"
import QueueTrends from "./QueueTrends"
import TodaySnapshot from "./TodaySnapshot"
import SummaryAnalysis from "./SummaryAnalysis"
import { useNavigate, useParams } from "react-router-dom"
import { useEffect, useState } from "react"
import { toast } from "react-toastify"
import { getRestaurant } from "@/services/restaurantService"
import {
  getTodaySnapshot,
  getSummary,
  getTrends,
} from "@/services/analyticsService"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { LayoutDashboard, Calendar, Star, Clock, BarChart } from "lucide-react"
import LoadingSpinner from "../common/LoadingSpinner"
import { isOpenToday, isWithinOpeningHours } from "@/utils/timeConverter"
import { ownedByUser, userIsOwner } from "@/utils/ownerCheck"

const RestaurantPerformance = ({ user }) => {
  const navigate = useNavigate()
  const { restaurantId } = useParams()
  const [restaurant, setRestaurant] = useState(null)
  const [restaurantLoading, setRestaurantLoading] = useState(true)
  const [analyticsLoading, setAnalyticsLoading] = useState(true)
  const [snapshotData, setSnapshotData] = useState(null)
  const [isOpen, setIsOpen] = useState(true)
  const [withinOpeningHours, setWithinOpeningHours] = useState(false)

  const [reservationTrendData, setReservationTrendData] = useState([])
  const [reviewTrendData, setReviewTrendData] = useState([])
  const [queueTrendData, setQueueTrendData] = useState([])

  const [summaryData, setSummaryData] = useState(null)

  useEffect(() => {
    async function fetchRestaurant() {
      try {
        const res = await getRestaurant(restaurantId)
        setRestaurant(res)
        setIsOpen(isOpenToday(res))
        setWithinOpeningHours(isWithinOpeningHours(res.openingHours))
      } catch (ex) {
        if (ex.response && ex.response.status === 404) {
          navigate("/not-found", { replace: true })
          return
        }
        toast.error("Failed to fetch restaurant details", {
          toastId: "Restaurant-not-found",
        })
      } finally {
        setRestaurantLoading(false)
      }
    }
    fetchRestaurant()
  }, [restaurantId, navigate])
  useEffect(() => {
    if (!restaurant) return
    console.log(restaurant)
    if (!userIsOwner(user) || !ownedByUser(restaurant, user)) {
      navigate("/restaurants")
      toast.error(
        "Only Restaurant Owners are allowed to view the Restaurant Statistics",
        {
          toastId: "nonOwnedStatsView",
        }
      )
      return
    }

    async function fetchAnalytics() {
      try {
        if (isOpen) {
          const snapshot = await getTodaySnapshot(restaurant._id)
          setSnapshotData(snapshot)
        }
        const { entries: trendEntries = [] } = await getTrends(
          restaurant._id,
          180
        )

        setReservationTrendData(
          trendEntries.map((entry) => ({
            date: entry.date,
            reservations: entry.reservations?.total || 0,
          }))
        )

        setReviewTrendData(
          trendEntries.map((entry) => ({
            date: entry.date,
            count: entry.reviews?.count || 0,
            attendanceCount: entry.reservations?.attended || 0,
            averageRating: entry.reviews?.averageRating || 0,
            ratingMode: entry.reviews?.ratingMode || 0,
          }))
        )

        setQueueTrendData(trendEntries)

        const summary = await getSummary(restaurant._id, {
          amount: 3,
          unit: "month",
        })
        setSummaryData(summary)
      } catch {
        toast.error("Failed to fetch analytics data")
      } finally {
        setAnalyticsLoading(false)
      }
    }

    fetchAnalytics()
  }, [restaurant, user, navigate])

  if (restaurantLoading || analyticsLoading) return <LoadingSpinner />
  return (
    <div className="w-full mt-6 flex flex-col items-center">
      <h1 className="mb-6 text-2xl font-bold">
        Restaurant Performance Analysis
      </h1>
      <h1 className="mb-6 text-lg text-muted-foreground">
        Restaurant: {restaurant.name} @ {restaurant.address}
      </h1>

      <Tabs defaultValue="today" className="w-full max-w-6xl">
        <TabsList className="grid w-full grid-cols-5 mb-6 text-xs md:text-sm">
          <TabsTrigger
            value="today"
            className="flex items-center justify-center gap-2"
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="hidden md:inline">Today</span>
          </TabsTrigger>
          <TabsTrigger
            value="reservation"
            className="flex items-center justify-center gap-2"
          >
            <Calendar className="w-5 h-5" />
            <span className="hidden md:inline">Reservations</span>
          </TabsTrigger>
          <TabsTrigger
            value="review"
            className="flex items-center justify-center gap-2"
          >
            <Star className="w-5 h-5" />
            <span className="hidden md:inline">Reviews</span>
          </TabsTrigger>
          <TabsTrigger
            value="queue"
            className="flex items-center justify-center gap-2"
          >
            <Clock className="w-5 h-5" />
            <span className="hidden md:inline">Queue</span>
          </TabsTrigger>
          <TabsTrigger
            value="summary"
            className="flex items-center justify-center gap-2"
          >
            <BarChart className="w-5 h-5" />
            <span className="hidden md:inline">Summary</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="today">
          <div className="w-full flex justify-center">
            {snapshotData ? (
              <TodaySnapshot data={snapshotData} isOpen={withinOpeningHours} />
            ) : (
              <div className="text-muted-foreground mt-4 text-sm italic">
                Restaurant is closed today. No snapshot available.
              </div>
            )}
          </div>
        </TabsContent>
        <TabsContent value="reservation">
          <div className="w-full flex justify-center">
            <ReservationTrends
              data={{
                reservationOverTime: reservationTrendData,
                reservationByGroupSize:
                  summaryData?.entries?.map((entry) => ({
                    label: entry.label,
                    data: {
                      totalReservations:
                        entry.aggregated?.reservations?.total || 0,
                      reservationsAttended:
                        entry.aggregated?.reservations?.attended || 0,
                      averagePax:
                        entry.aggregated?.reservations?.averagePax || 0,
                    },
                  })) || [],
              }}
            />
          </div>
        </TabsContent>
        <TabsContent value="review">
          <div className="w-full flex justify-center">
            <ReviewTrends data={reviewTrendData} />
          </div>
        </TabsContent>
        <TabsContent value="queue">
          <div className="w-full flex justify-center">
            <QueueTrends data={queueTrendData} />
          </div>
        </TabsContent>
        <TabsContent value="summary">
          <div className="w-full flex justify-center">
            <SummaryAnalysis restaurant={restaurant} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default RestaurantPerformance
