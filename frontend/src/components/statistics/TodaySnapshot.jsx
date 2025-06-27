import { Card, CardContent } from "@/components/ui/card"
import PieChart from "../common/charts/PieChart"
import WaitTimeAndReservation from "../common/WaitTimeAndReservation"
import { CalendarClock } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import React from "react"

const TodaySnapshot = () => {
  const dummyData = [
    { label: "1-2 Pax", value: 45 },
    { label: "3-4 Pax", value: 30 },
    { label: "5+ Pax", value: 25 },
  ]
  return (
    <React.Fragment>
      <Card className="shadow-sm border w-fit mt-6">
        <CardContent className="pt-2 pb-2 px-4 md:px-6">
          <div className="flex items-center space-x-2 mb-3">
            <CalendarClock className="text-primary w-7 h-7" />
            <h2 className="text-2xl font-semibold">Today's Snapshot</h2>
          </div>

          <Separator className="mb-4" />

          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 items-center">
            <div className="flex justify-center">
              <WaitTimeAndReservation time={5} count={5} />
            </div>

            <Separator orientation="vertical" />

            <div className="flex justify-center">
              <PieChart data={dummyData} width={250} height={250} />
            </div>
          </div>
        </CardContent>
      </Card>
    </React.Fragment>
  )
}

export default TodaySnapshot
