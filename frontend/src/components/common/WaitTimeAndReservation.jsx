import { AlertCircle, Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const urgencyColours = {
  low: "text-green-400",
  medium: "text-yellow-400",
  high: "text-red-400",
}

const WaitTimeAndReservation = ({ time, count }) => {
  const urgency = time >= 30 ? "high" : time >= 15 ? "medium" : "low"

  return (
    <Card className="mb-6 shadow-sm border w-fit">
      <CardContent className="space-y-2">
        <h3 className="text-base font-semibold">Customer Flow</h3>
        <div className="h-px bg-muted" />
        <div className="flex items-center justify-center text-muted-foreground">
          <div className="flex items-center gap-1">
            <span>
              Average Wait Time:{" "}
              <span className="font-medium text-black">{time} mins</span>
            </span>
            {urgency === "high" ? (
              <AlertCircle className="w-6 h-6 mb-1 text-red-500" />
            ) : (
              <Clock className={`w-6 h-6 mb-1 ${urgencyColours[urgency]}`} />
            )}
          </div>
        </div>
        <div className="flex items-center justify-center gap-x-1">
          <p className="text-muted-foreground">Total Reservations:</p>
          <p className="font-medium">{count}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default WaitTimeAndReservation
