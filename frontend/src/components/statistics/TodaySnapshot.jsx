import { Card, CardContent } from "@/components/ui/card"
import PieChart from "../common/charts/PieChart"
import WaitTimeAndReservation from "../common/WaitTimeAndReservation"
import { CalendarClock } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import React from "react"
import LiveBubble from "../common/LiveBubble"

const TodaySnapshot = ({ data, isOpen }) => {
  const { reservation, queue } = data
  const { attended, averageWaitTime, byQueueGroup } = queue || {}

  const pieData = ["small", "medium", "large"]
    .map((key) => {
      const val = byQueueGroup?.[key]?.attended || 0
      return {
        label: key
          .replace(/([a-z])([A-Z])/g, "$1 $2")
          .replace(/^./, (s) => s.toUpperCase()),
        value: val,
      }
    })
    .filter((d) => d.value > 0)

  const totalReservations = reservation?.total || 0
  const upcoming = reservation?.upcoming || 0
  const noShow = Math.max(totalReservations - (reservation?.attended || 0), 0)
  const completed = Math.max(totalReservations - upcoming, 0)
  const reservationProgress = totalReservations
    ? (completed / totalReservations) * 100
    : 0

  const bgColour = isOpen ? "bg-green-500" : "bg-gray-500"
  const textColour = isOpen
    ? "bg-green-100 text-green-600"
    : "bg-gray-100 text-gray-600"
  return (
    <React.Fragment>
      <Card className="shadow-sm border w-fit mt-6 relative">
        <LiveBubble
          bgColour={bgColour}
          isOpen={isOpen}
          textColour={textColour}
        />

        <CardContent className="pt-2 pb-2 px-4 md:px-6">
          <div className="flex items-center space-x-2 mb-3">
            <CalendarClock className="text-primary w-7 h-7" />
            <h2 className="text-2xl font-semibold">Today&apos;s Snapshot</h2>
          </div>

          <Separator className="mb-4" />

          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 items-center">
            <div className="flex justify-center">
              <WaitTimeAndReservation time={averageWaitTime} count={attended} />
            </div>

            <Separator orientation="vertical" />

            <div className="flex justify-center">
              <PieChart data={pieData} width={200} height={200} />
            </div>
          </div>

          <div className="mt-6">
            <div className="text-sm font-medium mb-1 flex justify-between">
              <span>Reservation Status</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-xs text-muted-foreground cursor-pointer">
                    {isOpen
                      ? `${completed} completed / ${upcoming} upcoming`
                      : `${noShow} no-show / ${attended} attended`}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-xs">
                    <div>Total Reservations: {totalReservations}</div>
                    {isOpen ? (
                      <>
                        <div>Completed: {completed}</div>
                        <div>Upcoming: {upcoming}</div>
                      </>
                    ) : (
                      <>
                        <div>No Shows: {noShow}</div>
                        <div>Attended: {attended}</div>
                      </>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
            <Progress value={reservationProgress} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </React.Fragment>
  )
}

export default TodaySnapshot
