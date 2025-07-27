import * as d3 from "d3"
import { useEffect, useRef, useState } from "react"
import { Users, ChevronLeft, ChevronRight } from "lucide-react"

const weekdayMap = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

const FootFall = ({ data, mode = "day", width = 160, height = 100 }) => {
  const chartRef = useRef()
  const isMultiDay = mode !== "day"
  const isMonth = mode === "month"

  const [weekIndex, setWeekIndex] = useState(0)
  const [dayIndex, setDayIndex] = useState(0)

  const getCurrentData = () => {
    if (!isMultiDay) return data[0]?.aggregated

    const week = data[weekIndex]?.aggregated
    let weekdayData = [...(week?.visitLoadByWeekday || [])].sort(
      (a, b) => a.weekday - b.weekday
    )
    if (!weekdayData || dayIndex >= weekdayData.length) return null

    const currentDay = weekdayData[dayIndex]

    const result = {}

    if (week.totalVisits != null) {
      result.totalVisits = week.totalVisits
    }

    if (currentDay?.averageLoad && currentDay?.startHour != null) {
      result.visitLoadByHour = {
        load: currentDay.averageLoad,
        startHour: currentDay.startHour,
      }
    }

    if (currentDay?.weekday != null) {
      result.weekday = currentDay.weekday
    }

    return result
  }

  const currentData = getCurrentData()
  const label =
    isMultiDay && currentData
      ? weekdayMap[currentData.weekday ?? dayIndex] || `Day ${dayIndex}`
      : null

  const handlePrev = () => {
    if (!isMultiDay) return

    if (dayIndex > 0) {
      setDayIndex(dayIndex - 1)
    } else if (weekIndex > 0) {
      const prevWeekDays =
        data[weekIndex - 1]?.aggregated?.visitLoadByWeekday?.length || 1
      setWeekIndex(weekIndex - 1)
      setDayIndex(prevWeekDays - 1)
    }
  }

  const handleNext = () => {
    if (!isMultiDay) return

    const currWeekDays =
      data[weekIndex]?.aggregated?.visitLoadByWeekday?.length || 1
    if (dayIndex < currWeekDays - 1) {
      setDayIndex(dayIndex + 1)
    } else if (weekIndex < data.length - 1) {
      setWeekIndex(weekIndex + 1)
      setDayIndex(0)
    }
  }

  useEffect(() => {
    const load = currentData?.visitLoadByHour?.load
    const startHour = currentData?.visitLoadByHour?.startHour
    if (!load || startHour == null) return

    const margin = { top: 10, right: 20, bottom: 20, left: 30 }
    const chartWidth = width - margin.left - margin.right
    const chartHeight = height - margin.top - margin.bottom

    const svg = d3.select(chartRef.current)
    svg.selectAll("*").remove()
    svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet")

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`)

    const xDomain = d3.range(load.length)
    const hourLabels = xDomain.map((i) => (startHour + i) % 24)

    const x = d3.scaleBand().domain(xDomain).range([0, chartWidth]).padding(0.1)
    const y = d3
      .scaleLinear()
      .domain([0, d3.max(load)])
      .nice()
      .range([chartHeight, 0])

    g.selectAll("rect")
      .data(load)
      .enter()
      .append("rect")
      .attr("x", (_, i) => x(i))
      .attr("y", (d) => y(d))
      .attr("width", x.bandwidth())
      .attr("height", (d) => chartHeight - y(d))
      .attr("fill", "#94a3b8")
      .attr("rx", 2)

    const tickValues = xDomain.filter((i) => i % 3 === 0)

    g.append("g")
      .attr("transform", `translate(0, ${chartHeight})`)
      .call(
        d3
          .axisBottom(x)
          .tickValues(tickValues)
          .tickFormat((i) => `${hourLabels[i]}h`)
          .tickSizeOuter(0)
      )
      .selectAll("text")
      .attr("font-size", 8)
      .attr("font-weight", "500")
      .attr("fill", "#1e293b")

    g.append("g")
      .call(
        d3
          .axisLeft(y)
          .ticks(3)
          .tickSize(-chartWidth)
          .tickFormat(d3.format("~s"))
      )
      .selectAll("text")
      .attr("font-size", 8)
      .attr("font-weight", "800")
      .attr("fill", "#64748b")

    g.selectAll(".domain").remove()
    g.selectAll(".tick line")
      .attr("stroke", "#e2e8f0")
      .attr("stroke-dasharray", "2,2")
  }, [currentData])

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 font-semibold">
        <Users className="w-4 h-4 text-primary" />
        Footfall
      </div>

      {!isMultiDay && (
        <div className="flex items-center text-muted-foreground text-sm">
          <span className="mr-2">Date:</span>
          <span className="text-foreground font-medium">
            {currentData?.date?.split("T")[0]}
          </span>
        </div>
      )}

      {currentData?.totalVisits && (
        <div className="flex items-center text-muted-foreground text-sm">
          <span className="mr-2">Total Visits:</span>
          <span className="text-foreground font-medium">
            {currentData.totalVisits}
          </span>
        </div>
      )}

      {isMultiDay && currentData && (
        <div className="text-xs text-muted-foreground text-center mt-1">
          {label}
        </div>
      )}

      {isMultiDay ? (
        <div className="flex items-center justify-between">
          <ChevronLeft
            className={`w-4 h-4 cursor-pointer ${
              weekIndex === 0 && dayIndex === 0 ? "opacity-30" : ""
            }`}
            onClick={handlePrev}
          />
          <div className="flex justify-center">
            <svg ref={chartRef} className="w-full" />
          </div>
          <ChevronRight
            className={`w-4 h-4 cursor-pointer ${
              weekIndex === data.length - 1 &&
              dayIndex ===
                (data[weekIndex]?.aggregated?.visitLoadByWeekday?.length || 1) -
                  1
                ? "opacity-30"
                : ""
            }`}
            onClick={handleNext}
          />
        </div>
      ) : (
        <div className="flex justify-center">
          <div className="w-[250px]">
            <svg ref={chartRef} className="w-full" />
          </div>
        </div>
      )}
      {isMonth && (
        <i className="text-sm text-muted-foreground">Averaged Data</i>
      )}
    </div>
  )
}

export default FootFall
