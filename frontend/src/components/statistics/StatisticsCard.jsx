import { Card } from "@/components/ui/card"
import MiniPieChart from "../common/charts/MiniPieChart"
import { AlertCircle, Clock, Users } from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"
import { isWithinOpeningHours } from "@/utils/timeConverter"
import LiveBubble from "../common/LiveBubble"

const urgencyColours = {
  low: "text-green-400",
  medium: "text-yellow-400",
  high: "text-red-400",
}

const StatisticsCard = ({ restaurant, today }) => {
  console.log(today)
  const navigate = useNavigate()
  const location = useLocation()
  const averageWaitTime =
    today?.queue?.averageWaitTime != null ? today.queue.averageWaitTime : "--"

  const reservationCount =
    today?.reservations?.total != null ? today.reservations.total : "--"

  const queueBreakdownRaw = ["small", "medium", "large"].map((key) => {
    const val = today?.queue?.byQueueGroup?.[key]?.attended
    return {
      label: key
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/^./, (s) => s.toUpperCase()),
      value: typeof val === "number" ? val : null,
    }
  })

  const queueBreakdown = queueBreakdownRaw.filter(
    (d) => d.value !== null && d.value > 0
  )

  const hasQueueData = queueBreakdown.length > 0

  const isOpen = isWithinOpeningHours(restaurant.openingHours)

  const urgency =
    typeof averageWaitTime === "number"
      ? averageWaitTime >= 30
        ? "high"
        : averageWaitTime >= 15
        ? "medium"
        : "low"
      : "low"

  return (
    <Card
      className="w-[380px] p-4 shadow-sm relative flex flex-row items-center gap-4 cursor-pointer hover:bg-gray-100"
      onClick={() => {
        navigate(`/statistics/${restaurant._id}`, {
          state: { restaurant, from: location.pathname },
        })
      }}
    >
      <div className="absolute top-2 right-2 z-10">
        <LiveBubble
          bgColour={isOpen ? "bg-green-500" : "bg-gray-500"}
          isOpen={isOpen}
          textColour={
            isOpen ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-600"
          }
        />
      </div>
      <div className="w-[100px] text-center font-semibold text-2xl">
        {restaurant.name}
      </div>

      <div className="w-px self-stretch bg-gray-400" />

      <div className="flex flex-col items-center justify-center gap-3">
        <div className="flex flex-col items-center">
          {averageWaitTime === "--" ? (
            <Clock className="w-6 h-6 mb-1 text-gray-400" />
          ) : urgency === "high" ? (
            <AlertCircle className="w-6 h-6 mb-1 text-red-500" />
          ) : (
            <Clock className={`w-6 h-6 mb-1 ${urgencyColours[urgency]}`} />
          )}
          <div className="text-xs text-muted-foreground">Average Wait</div>
          <div className="text-lg font-bold">
            {averageWaitTime === "--" ? "--" : `${averageWaitTime} min`}
          </div>
        </div>
        <div className="flex flex-col items-center">
          <Users className="w-6 h-6 mb-1 text-blue-500" />
          <div className="text-xs text-muted-foreground">Reservations</div>
          <div className="text-lg font-bold">{reservationCount}</div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center w-[100px]">
        {hasQueueData ? (
          <MiniPieChart
            data={queueBreakdown}
            width={80}
            height={80}
            showLabels={false}
          />
        ) : (
          <div className="w-[80px] h-[80px] flex items-center justify-center text-lg text-gray-400 font-bold ">
            --
          </div>
        )}
        <div className="text-xs mt-1 text-muted-foreground">
          Queue Breakdown
        </div>
      </div>
    </Card>
  )
}

export default StatisticsCard
