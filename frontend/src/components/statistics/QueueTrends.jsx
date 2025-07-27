import { useState, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import LineChart from "../common/charts/LineChart"
import PieChart from "../common/charts/PieChart"
import { Clock, LogOut, Users } from "lucide-react"
import * as d3 from "d3"
const QueueTrends = ({ data }) => {
  const [group, setGroup] = useState("small")
  const tooltipRef = useRef()
  const queueData = useMemo(() => {
    return data.map((d) => ({
      date: d.date,
      averageWaitTime: d.queue?.averageWaitTime,
      abandonmentRate: d.queue?.abandonmentRate,
      byQueueGroup: d.queue?.byQueueGroup,
    }))
  }, [data])

  const averageWaitTimeData = queueData.map((d) => ({
    date: d.date,
    value: d.averageWaitTime,
  }))

  const groupDistributionData = useMemo(() => {
    const last = queueData[data.length - 1]
    return ["small", "medium", "large"].map((key) => ({
      label: key.charAt(0).toUpperCase() + key.slice(1),
      value: last?.byQueueGroup[key]?.total,
    }))
  }, [data]).filter((d) => d.value > 0)

  const averageAbandonment = (
    queueData.reduce((acc, d) => acc + d.abandonmentRate, 0) / queueData.length
  ).toFixed(1)

  const groupStats = queueData.map((d) => {
    const { total, attended } = d.byQueueGroup[group]
    return {
      date: d.date,
      value: total ? parseFloat(((1 - attended / total) * 100).toFixed(1)) : 0,
      total,
      attended,
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
        ? `<span class="${
            change > 0
              ? "text-red-600"
              : change < 0
              ? "text-green-600"
              : "text-gray-500"
          }">(${change > 0 ? "+" : ""}${change.toFixed(1)}%)</span>`
        : ""

    const dateFormatted = d3.timeFormat("%B %d, %Y")(new Date(d.date))

    const tooltipHtml =
      d.total !== undefined
        ? `
      <div class='p-2 text-center text-sm'>
        <div class='mb-1'>Date:</div>
        <strong>${dateFormatted}</strong>
        <div class='mt-1'>Group Abandonment:</div>
        <strong>${d.value.toFixed(1)}%</strong>
        <div class='mt-1'>Total: ${d.total}</div>
        <div class='mt-1'>Attended: ${d.attended}</div>
        ${changeStr}
      </div>`
        : `
      <div class='p-2 text-center text-sm'>
        <div class='mb-1'>Date:</div>
        <strong>${dateFormatted}</strong>
        <div class='mt-1'>Average Wait Time:</div>
        <strong>${d.value.toFixed(1)} min</strong>
        ${changeStr}
      </div>`

    d3.select(tooltipEl)
      .style("display", "block")
      .style("left", `${event.pageX + 10}px`)
      .style("top", `${event.pageY - 50}px`)
      .html(tooltipHtml)
  }

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
        <Users className="w-8 h-8" /> Queue Insights
      </h1>
      <p className="text-m text-muted-foreground mb-4">
        Average Abandonment Rate: <strong>{averageAbandonment}%</strong>
      </p>
      <h1 className="text-xl font-semibold mt-10 mb-4 flex items-center justify-center gap-2">
        <Clock className="w-5 h-5" />
        Average Wait Times:
      </h1>
      <LineChart
        data={averageWaitTimeData}
        circleColour="#41ab5d"
        colour="#74c476"
        tooltipRef={tooltipRef}
        onHoverPoint={onLineHoverPoint}
      />

      <h1 className="text-xl font-semibold mt-10 mb-4 flex items-center justify-center gap-2">
        <LogOut className="w-5 h-5" />
        Queue Abandonement by Group:
      </h1>
      <div className="flex gap-2 my-2 items-center justify-center">
        {["small", "medium", "large"].map((g) => (
          <Button
            key={g}
            variant={group === g ? "default" : "outline"}
            onClick={() => setGroup(g)}
          >
            {g.charAt(0).toUpperCase() + g.slice(1)}
          </Button>
        ))}
      </div>
      <div className="relative mb-10">
        <LineChart
          data={groupStats}
          colour="#ffaaa5"
          circleColour="#ff8b94"
          tooltipRef={tooltipRef}
          onHoverPoint={onLineHoverPoint}
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
          pointerEvents: "none",
        }}
      />

      <div className="mt-6 text-m font-medium text-center">
        Latest Group Distribution
      </div>
      <PieChart data={groupDistributionData} showLabels={false} />
    </div>
  )
}

export default QueueTrends
