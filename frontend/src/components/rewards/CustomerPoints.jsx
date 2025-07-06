import { useEffect, useState } from "react"
import { Button } from "../ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Progress } from "../ui/progress"
import { useNavigate } from "react-router-dom"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip"
import { Store, Ticket } from "lucide-react"
import {
  getCustomerPointsAll,
  getCustomerPointsForRestaurant,
} from "@/services/rewardService"
import { getRestaurant } from "@/services/restaurantService"

const CustomerPoints = ({ restaurant }) => {
  const navigate = useNavigate()
  const [points, setPoints] = useState(0)
  const [topRestaurants, setTopRestaurants] = useState([])

  useEffect(() => {
    const fetchPoints = async () => {
      try {
        if (restaurant?._id) {
          const data = await getCustomerPointsForRestaurant(restaurant._id)
          setPoints(data.points || 0)
        } else {
          const data = await getCustomerPointsAll()
          const sorted = [...data.points].sort((a, b) => b.points - a.points)

          setPoints(sorted.reduce((sum, r) => sum + r.points, 0))

          const top = await Promise.all(
            sorted.slice(0, 3).map(async (entry) => {
              const restaurant = await getRestaurant(entry.restaurant)
              return {
                ...restaurant,
                points: entry.points,
              }
            })
          )

          setTopRestaurants(top)
        }
      } catch {
        setPoints(0)
        setTopRestaurants([])
      }
    }

    fetchPoints()
  }, [restaurant])

  const lowerBound = Math.floor(points / 1000) * 1000
  const upperBound = points === 0 ? 1000 : Math.ceil(points / 1000) * 1000
  const progressValue =
    upperBound === lowerBound
      ? 100
      : ((points - lowerBound) / (upperBound - lowerBound)) * 100

  return (
    <Card className="mb-4 shadow border border-gray-200">
      <CardHeader className="pb-2 text-center">
        <CardTitle className="text-xl font-semibold mb-1">
          Your Reward Progress
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Track your points to see how close you are to your next reward
        </p>
      </CardHeader>
      <CardContent className="px-6">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex flex-col items-center mt-2 mb-6">
                <div className="flex justify-between w-full text-xs text-muted-foreground mb-1">
                  <span>{lowerBound}</span>
                  <span>{upperBound}</span>
                </div>
                <Progress
                  value={progressValue}
                  className="h-4 w-full rounded-full"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {restaurant ? (
                <p>
                  {points} pts • {upperBound - points} points to reach{" "}
                  {upperBound}
                </p>
              ) : (
                <div className="space-y-1 items-center flex flex-col">
                  <p>
                    Total Points:{" "}
                    <span className="font-semibold text-sky-300">
                      {points} pts
                    </span>
                  </p>
                  <div className="space-y-2">
                    {topRestaurants.map((r) => (
                      <div
                        key={r._id}
                        className="flex justify-between items-center gap-1 px-3 py-2 border rounded-md"
                      >
                        <p className="font-medium whitespace-nowrap">
                          {r.name}:
                        </p>
                        <p className="text-sky-300 font-semibold">
                          {r.points} pts
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="flex justify-center gap-4 mt-4">
          <Button
            onClick={() =>
              restaurant?._id
                ? navigate(`/restaurants/${restaurant._id}`)
                : navigate("/restaurants")
            }
            className="flex items-center gap-2 bg-blue-400 hover:bg-blue-500 text-white"
          >
            <Store className="w-5 h-5" />
            {restaurant?._id ? restaurant.name : "Restaurants"}
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate("/my-rewards")}
            className="flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-white"
          >
            <Ticket className="w-5 h-5" />
            My Rewards
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default CustomerPoints
