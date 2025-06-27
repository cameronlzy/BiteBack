import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import MiniPieChart from "../common/charts/MiniPieChart"
import { AlertCircle, Clock, Users } from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"

const urgencyColours = {
  low: "text-green-400",
  medium: "text-yellow-400",
  high: "text-red-400",
}

const StatisticsCard = ({ restaurant, today }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const urgency =
    today.averageWaitTime >= 30
      ? "high"
      : today.averageWaitTime >= 15
      ? "medium"
      : "low"

  return (
    <Card
      className="w-[380px] p-4 shadow-sm flex flex-row items-center gap-4 cursor-pointer hover:bg-gray-100"
      onClick={() => {
        navigate(`/statistics/${restaurant.id}`, {
          state: { restaurant, from: location.pathname },
        })
      }}
    >
      <div className="w-[100px] text-center font-semibold text-2xl">
        {restaurant.name}
      </div>

      <div className="w-px self-stretch bg-gray-400" />

      <div className="flex flex-col items-center justify-center gap-3">
        <div className="flex flex-col items-center">
          {urgency === "high" ? (
            <AlertCircle className="w-6 h-6 mb-1 text-red-500" />
          ) : (
            <Clock className={`w-6 h-6 mb-1 ${urgencyColours[urgency]}`} />
          )}
          <div className="text-xs text-muted-foreground">Average Wait</div>
          <div className="text-lg font-bold">{today.averageWaitTime} min</div>
        </div>
        <div className="flex flex-col items-center">
          <Users className="w-6 h-6 mb-1 text-blue-500" />
          <div className="text-xs text-muted-foreground">Reservations</div>
          <div className="text-lg font-bold">{today.reservationCount}</div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center w-[100px]">
        <MiniPieChart data={today.queueBreakdown} width={80} height={80} />
        <div className="text-xs mt-1 text-muted-foreground">
          Queue Breakdown
        </div>
      </div>
    </Card>
  )
}

export default StatisticsCard
