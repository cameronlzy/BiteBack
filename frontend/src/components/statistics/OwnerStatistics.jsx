import { useEffect, useState } from "react"
import StatisticsCard from "./StatisticsCard"
import { getTodaySnapshot } from "@/services/analyticsService"
import { toast } from "react-toastify"
import { convertOpeningHoursToSGT } from "@/utils/timeConverter"

const OwnerStatistics = ({ user }) => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchSnapshots = async () => {
    if (!user?.profile?.restaurants?.length) return
    setLoading(true)
    try {
      const snapshots = await Promise.all(
        user.profile?.restaurants.map(async (restaurant) => {
          console.log(restaurant)
          const snapshot = await getTodaySnapshot(restaurant._id)

          const openingHoursSGT = restaurant.openingHours
            ? convertOpeningHoursToSGT(restaurant.openingHours)
            : restaurant.openingHours

          return {
            restaurant: {
              ...restaurant,
              openingHours: openingHoursSGT,
            },
            today: snapshot,
          }
        })
      )
      setData(snapshots)
    } catch (err) {
      console.error(err)
      toast.error("Failed to load statistics")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSnapshots()
  }, [user])

  return (
    <div className="p-6 space-y-6 flex flex-col items-center">
      <h1 className="text-2xl font-bold">Statistics Overview</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        data.map((d) => (
          <StatisticsCard
            key={d.restaurant._id}
            today={d.today}
            restaurant={d.restaurant}
          />
        ))
      )}
    </div>
  )
}

export default OwnerStatistics
