import { useRef } from "react"
import * as d3 from "d3"
import LineChart from "../common/charts/LineChart"
import BarChart from "../common/charts/BarChart"
import { Phone } from "lucide-react"

const ReservationTrends = ({ data }) => {
  const tooltipRef = useRef()
  const barTooltipRef = useRef()

  const onBarHoverPoint = (event, d, _all, tooltipEl) => {
    const { total, attended, averagePax, noShow, noShowRate } = d.values
    const {
      total: prevTotal,
      attended: prevAttended,
      averagePax: prevAvg,
    } = d.prev || {}

    const formatChange = (curr, prev, invert = false) => {
      if (prev == null || prev === 0) return ""
      const change = ((curr - prev) / prev) * 100
      const sign = change > 0 ? "+" : ""
      const colour =
        change === 0
          ? "text-gray-500"
          : change > 0
          ? invert
            ? "text-red-600"
            : "text-green-600"
          : invert
          ? "text-green-600"
          : "text-red-600"
      return ` <i class="${colour}">(${sign}${change.toFixed(1)}%)</i>`
    }

    const prevNoShow = d.prev ? d.prev.total - d.prev.attended : null
    const prevNoShowRate = d.prev ? (prevNoShow / d.prev.total) * 100 : null

    d3.select(tooltipEl)
      .style("display", "block")
      .style("left", `${event.pageX + 10}px`)
      .style("top", `${event.pageY - 50}px`)
      .html(
        `<div class='p-2 text-center'>
        <div class='mb-1'>Month: <strong>${d.label}</strong></div>
        <div class='p-2'><div class='mb-1'>Average Pax:</div>
          <strong>${averagePax.toFixed(1)}</strong>${formatChange(
          averagePax,
          prevAvg
        )}
        </div>
        <div class='p-2'><div class='mb-1'>Total Reservations:</div>
          <strong>${total}</strong>${formatChange(total, prevTotal)}
        </div>
        <div class='p-2'><div class='mb-1'>Attended:</div>
          <strong>${attended}</strong>${formatChange(attended, prevAttended)}
        </div>
        <div class='p-2'><div class='mb-1'>No-Show:</div>
          <strong>${noShow}</strong>${formatChange(noShow, prevNoShow, true)}
        </div>
        <div class='p-2'><div class='mb-1'>No-Show Rate:</div>
          <strong>${noShowRate.toFixed(1)}%</strong>${formatChange(
          noShowRate,
          prevNoShowRate,
          true
        )}
        </div>
      </div>`
      )
  }

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

    d3.select(tooltipEl)
      .style("display", "block")
      .style("left", `${event.pageX + 10}px`)
      .style("top", `${event.pageY - 50}px`)
      .html(
        `<div class='p-2 text-center text-sm'>
          <div class='mb-1'>Date:</div>
          <strong>${d3.timeFormat("%B %d, %Y")(new Date(d.date))}</strong>
          <div class='mt-1 mb-1'>Total Reservations</div>
          <strong>${d.value}</strong>
          ${changeStr}
        </div>`
      )
  }

  const lineChartData = data.reservationOverTime.map((d, i, arr) => {
    const prev = i > 0 ? arr[i - 1].reservations : null
    const change = prev !== null ? ((d.reservations - prev) / prev) * 100 : 0
    return {
      date: d.date,
      value: d.reservations,
      percentChange: change.toFixed(1),
    }
  })

  const barChartData = data.reservationByGroupSize.map((d, i, arr) => {
    const prev = i > 0 ? arr[i - 1] : null
    const total = d.data.totalReservations
    const attended = d.data.reservationsAttended
    const averagePax = d.data.averagePax
    const noShow = total - attended
    const noShowRate = (noShow / total) * 100

    return {
      label: d.label,
      values: {
        total,
        attended,
        averagePax,
        noShow,
        noShowRate,
      },
      prev: prev
        ? {
            total: prev.data.totalReservations,
            attended: prev.data.reservationsAttended,
            averagePax: prev.data.averagePax,
          }
        : null,
    }
  })

  console.log(barChartData)

  return (
    <div className="w-full">
      <h1 className="text-xl font-semibold mb-4">
        Monthly Reservations Analysis
      </h1>

      <BarChart
        data={barChartData}
        onHoverPoint={onBarHoverPoint}
        tooltipRef={barTooltipRef}
        colourMap={{
          total: "#d1d5db",
          attended: "#4ade80",
          noShow: "#d1d5db",
        }}
      />
      <div
        ref={barTooltipRef}
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

      <h1 className="text-xl font-semibold mt-10 mb-4 flex items-center justify-center gap-2">
        <Phone className="w-5 h-5" />
        Reservations Over Time
      </h1>
      <div className="relative mb-10">
        <LineChart
          data={lineChartData}
          onHoverPoint={onLineHoverPoint}
          tooltipRef={tooltipRef}
        />
        <div className="mt-4 text-xs text-muted-foreground text-center">
          % change shown vs previous data point
        </div>
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
  )
}

export default ReservationTrends
