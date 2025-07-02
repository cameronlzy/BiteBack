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

const CustomerPoints = ({ customer }) => {
  const navigate = useNavigate()
  const currentPoints = customer?.points || 0
  const lowerBound = Math.floor(currentPoints / 1000) * 1000
  const upperBound = Math.ceil(currentPoints / 1000) * 1000
  const progressValue =
    upperBound === lowerBound
      ? 100
      : ((currentPoints - lowerBound) / (upperBound - lowerBound)) * 100

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
              <p>
                {currentPoints} pts • {upperBound - currentPoints} points to
                reach {upperBound}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="flex justify-center gap-4 mt-4">
          <Button
            onClick={() => navigate("/restaurants")}
            className="flex items-center gap-2 bg-blue-400 hover:bg-blue-500 text-white"
          >
            <Store className="w-5 h-5" />
            Restaurants
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate("/current-rewards")}
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
