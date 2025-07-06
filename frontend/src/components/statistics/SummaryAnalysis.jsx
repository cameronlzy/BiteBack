import { useEffect, useRef, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format, isBefore, startOfToday } from "date-fns"
import { Clock, Phone, PieChart, Star } from "lucide-react"
import { Separator } from "../ui/separator"
import FootFall from "../common/charts/FootFall"
import { getSummary } from "@/services/analyticsService"
import LoadingSpinner from "../common/LoadingSpinner"
import { toast } from "react-toastify"
import SubmitButton from "../common/SubmitButton"
import { isRestaurantClosed } from "@/utils/timeConverter"
import { DateTime } from "luxon"

const SummaryAnalysis = ({ restaurant }) => {
  const [unit, setUnit] = useState("day")
  const [selectedDate, setSelectedDate] = useState(
    new Date(Date.now() - 86400000)
  )
  const [tempNumber, setTempNumber] = useState("1")
  const prevUnitRef = useRef(unit)

  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)

  const getDisabledDates = () => {
    return (date) =>
      !date ||
      !isBefore(date, startOfToday()) ||
      isRestaurantClosed(restaurant, date)
  }

  const fetchData = async (possibleNum) => {
    if (!restaurant?._id) return
    const n = possibleNum
    if (unit !== "day" && n < 1) {
      setData(null)
      return
    }
    setLoading(true)
    try {
      const params =
        unit === "day"
          ? {
              date: DateTime.fromJSDate(selectedDate)
                .setZone("Asia/Singapore")
                .startOf("day")
                .toISO(),
            }
          : { unit, amount: n }

      const response = await getSummary(restaurant._id, params)
      if (response.type === "range") {
        setTempNumber(Math.min(n, response.dataPoints))
      }
      setData(response)
    } catch (ex) {
      console.log(ex)
      toast.error("Failed to fetch summary", {
        toastId: "fetch-summary-fail",
      })
      setData(null)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    const prevUnit = prevUnitRef.current
    prevUnitRef.current = unit

    if (!restaurant) return

    if (unit === "day") {
      fetchData()
    } else if (unit !== prevUnit) {
      setData(null)
    }
  }, [restaurant, unit, selectedDate])

  useEffect(() => {
    if (restaurant && unit === "day") fetchData()
  }, [restaurant, unit, selectedDate])
  const summary =
    data?.type === "single"
      ? data.aggregated
      : Array.isArray(data?.entries) && data.entries.length > 0
      ? data.entries[0].aggregated
      : null
  console.log(data)
  return (
    <Card className="w-full mt-6">
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <CardTitle className="text-xl">Summary Analysis</CardTitle>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-start sm:items-center w-full sm:w-auto">
          <Select value={unit} onValueChange={(val) => setUnit(val)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Select unit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Day</SelectItem>
              <SelectItem value="week">Weeks Ago</SelectItem>
              <SelectItem value="month">Months Ago</SelectItem>
            </SelectContent>
          </Select>

          {unit === "day" ? (
            <Popover>
              <PopoverTrigger asChild>
                <Input
                  readOnly
                  value={format(selectedDate, "PPP")}
                  className="w-[180px] cursor-pointer"
                />
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  disabled={getDisabledDates()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          ) : (
            <div className="flex items-center gap-2 bg-muted px-2 py-1 rounded-full border">
              <Input
                type="number"
                min={1}
                value={tempNumber}
                onChange={(e) => setTempNumber(e.target.value)}
                className="w-[100px] border-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent text-sm"
              />
              <SubmitButton
                type="button"
                size="sm"
                onClick={() => {
                  const parsed = parseInt(tempNumber)
                  if (!parsed || parsed < 1) {
                    setTempNumber("1")
                    return
                  }
                  fetchData(parsed)
                }}
                condition={loading}
                normalText="Search"
                loadingText="Loading..."
              />
            </div>
          )}
        </div>
      </CardHeader>
      <Separator />

      <CardContent className="grid grid-cols-2 lg:grid-cols-4 auto-rows-fr gap-4">
        {loading ? (
          <div className="flex justify-center items-center col-span-full py-8">
            <LoadingSpinner />
          </div>
        ) : summary ? (
          <>
            <div className="p-4 border rounded-xl bg-muted/40 col-span-2 row-span-2">
              <FootFall
                data={
                  data.type === "range"
                    ? [data.entries[0]]
                    : [{ aggregated: summary }]
                }
                mode={unit}
                width={220}
                height={200}
              />
            </div>

            <div className="p-3 sm:p-4 border rounded-xl bg-muted/40 text-sm">
              <div className="flex items-center gap-2 font-semibold mb-1">
                <Phone className="text-blue-600 w-4 h-4 shrink-0" />
                Reservations
              </div>
              <p className="text-muted-foreground">
                Total:{" "}
                <span className="text-foreground font-medium">
                  {summary.reservations.total}
                </span>
              </p>
              <p className="text-muted-foreground">
                Attended:{" "}
                <span className="text-foreground font-medium">
                  {summary.reservations.attended}
                </span>
              </p>
              <p className="text-muted-foreground">
                No-Show Rate:{" "}
                <span className="text-red-600 font-medium">
                  {(summary.reservations.noShowRate * 100).toFixed(1)}%
                </span>
              </p>
              <p className="text-muted-foreground">
                Avg Pax:{" "}
                <span className="text-foreground font-medium">
                  {summary.reservations.averagePax.toFixed(1)}
                </span>
              </p>
            </div>

            <div className="p-3 sm:p-4 border rounded-xl bg-muted/40 text-sm">
              <div className="flex items-center gap-2 font-semibold mb-1">
                <Star className="text-yellow-500 w-4 h-4 shrink-0" />
                Reviews
              </div>
              <p className="text-muted-foreground">
                Total:{" "}
                <span className="text-foreground font-medium">
                  {summary.reviews.count}
                </span>
              </p>
              <p className="text-muted-foreground">
                Avg Rating:{" "}
                <span className="text-green-600 font-medium">
                  {summary.reviews.averageRating.toFixed(1)}
                </span>
              </p>
              <p className="text-muted-foreground">
                Mode:{" "}
                <span className="text-foreground font-medium">
                  {summary.reviews.ratingMode}
                </span>
              </p>
            </div>

            <div className="p-3 sm:p-4 border rounded-xl bg-muted/40 text-sm">
              <div className="flex items-center gap-2 font-semibold mb-1">
                <Clock className="text-purple-600 w-4 h-4 shrink-0" />
                Queue
              </div>
              <p className="text-muted-foreground">
                Total:{" "}
                <span className="text-foreground font-medium">
                  {summary.queue.total}
                </span>
              </p>
              <p className="text-muted-foreground">
                Attended:{" "}
                <span className="text-foreground font-medium">
                  {summary.queue.attended}
                </span>
              </p>
              <p className="text-muted-foreground">
                Abandon Rate:{" "}
                <span className="text-red-600 font-medium">
                  {(summary.queue.abandonmentRate * 100).toFixed(1)}%
                </span>
              </p>
              <p className="text-muted-foreground">
                Avg Wait:{" "}
                <span className="text-foreground font-medium">
                  {summary.queue.averageWaitTime.toFixed(1)} mins
                </span>
              </p>
            </div>

            <div className="p-3 sm:p-4 border rounded-xl bg-muted/40 text-sm">
              <div className="flex items-center gap-2 font-semibold mb-1">
                <PieChart className="text-cyan-600 w-4 h-4 shrink-0" />
                Queue Distribution
              </div>
              {["small", "medium", "large"].map((key) => (
                <p key={key} className="text-muted-foreground">
                  {key.charAt(0).toUpperCase() + key.slice(1)}:{" "}
                  <span className="text-foreground font-medium">
                    {summary.queue.byQueueGroup[key]?.attended ?? 0}/
                    {summary.queue.byQueueGroup[key]?.total ?? 0}
                  </span>
                </p>
              ))}
            </div>
          </>
        ) : unit !== "day" && !data ? (
          <p className="text-muted-foreground text-sm col-span-full">
            Enter a number and press <span className="font-medium">Search</span>{" "}
            to view summary.
          </p>
        ) : (
          <p className="text-muted-foreground text-sm col-span-full">
            No data available for selected period
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export default SummaryAnalysis
