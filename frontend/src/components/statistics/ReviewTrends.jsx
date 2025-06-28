import { useRef, useState } from "react"
import ReactDOMServer from "react-dom/server"
import StarRating from "../common/StarRating"
import LineChart from "../common/charts/LineChart"
import * as d3 from "d3"
import { Button } from "../ui/button"
import { Star } from "lucide-react"

const ReviewTrends = ({ data }) => {
  const tooltipRef = useRef()
  const [showReviewRate, setShowReviewRate] = useState(false)
  const mode = data?.[0]?.ratingMode ?? 0

  const reviewData = data.map((d, i, arr) => {
    const prev = i > 0 ? arr[i - 1] : null

    const value = showReviewRate
      ? d.attendanceCount === 0
        ? 0
        : (d.count / d.attendanceCount) * 100
      : d.averageRating

    const prevValue = prev
      ? showReviewRate
        ? prev.attendanceCount === 0
          ? 0
          : (prev.count / prev.attendanceCount) * 100
        : prev.averageRating
      : null

    const change =
      prevValue && prevValue !== 0
        ? ((value - prevValue) / prevValue) * 100
        : null

    return {
      date: d.date,
      value,
      percentChange: change ? change.toFixed(1) : null,
      count: d.count,
      attendance: d.attendanceCount,
    }
  })

  const onLineHoverPoint = (event, d, allData, tooltipEl) => {
    const index = allData.findIndex((x) => x.date === d.date)
    const prev = index > 0 ? allData[index - 1] : null
    const change =
      prev && prev.value !== 0
        ? ((d.value - prev.value) / prev.value) * 100
        : null

    const changeStr =
      change !== null
        ? `<i class="${
            change > 0
              ? "text-green-600"
              : change < 0
              ? "text-red-600"
              : "text-gray-500"
          }">(${change > 0 ? "+" : ""}${change.toFixed(1)}%)</i>`
        : ""

    const dateFormatted = d3.timeFormat("%B %d, %Y")(new Date(d.date))

    const tooltipHtml = showReviewRate
      ? `
      <div class='p-2 text-center text-sm'>
        <div class='mb-1'>Date:</div>
        <strong>${dateFormatted}</strong>
        <div class='mt-1'>Review Count:</div>
        <strong>${d.count}</strong>
        <div class='mt-1'>Total Attended:</div>
        <strong>${d.attendance}</strong>
        <div class='mt-1'>Review Rate:</div>
        <strong>${d.value.toFixed(1)}%</strong>
        ${changeStr}
      </div>`
      : `
      <div class='p-2 text-center text-sm'>
        <div class='mb-1'>Date:</div>
        <strong>${dateFormatted}</strong>
        <div class='mt-1 mb-1'>Average Rating:</div>
        <strong>${d.value}</strong>
        ${changeStr}
        <div class="mt-1">${ReactDOMServer.renderToStaticMarkup(
          <StarRating rating={d.value} className="w-4 h-4" />
        )}</div>
      </div>`

    d3.select(tooltipEl)
      .style("display", "block")
      .style("left", `${event.pageX + 10}px`)
      .style("top", `${event.pageY - 50}px`)
      .html(tooltipHtml)
  }

  return (
    <div className="w-full items-center flex flex-col">
      <div className="items-center justify-center w-full flex flex-col">
        <h1 className="text-xl font-semibold mt-10 mb-4 flex items-center justify-center gap-2">
          <Star className="w-5 h-5" />
          Reviews Over Time
        </h1>
        <div className="flex justify-center mb-2">
          <Button
            variant="outline"
            onClick={() => setShowReviewRate((prev) => !prev)}
          >
            Show {showReviewRate ? "Average Rating" : "Review Rate"}
          </Button>
        </div>

        <div className="text-center mt-4">
          <div className="text-m text-muted-foreground mb-1">
            Most Common Rating
          </div>
          <StarRating rating={mode} className="w-8 h-8" />
        </div>
        <div className="relative mb-10">
          <LineChart
            data={reviewData}
            onHoverPoint={onLineHoverPoint}
            tooltipRef={tooltipRef}
            color={showReviewRate ? "#3b82f6" : "#facc15"}
          />
        </div>
        <div
          ref={tooltipRef}
          style={{
            position: "absolute",
            display: "none",
            backgroundColor: "white",
            padding: "10px",
            border: "1px solid #ddd",
            borderRadius: "6px",
            boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
            fontSize: "12px",
            fontFamily: "monospace",
            zIndex: 1000,
          }}
        />
      </div>
    </div>
  )
}

export default ReviewTrends
