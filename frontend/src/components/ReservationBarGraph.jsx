import * as d3 from "d3"
import { useEffect, useRef } from "react"
import { Users } from "lucide-react"

const ReservationBarGraph = ({ data, width = 800, height = 400 }) => {
  const ref = useRef()
  const tooltipRef = useRef()

  const barPadding = 0.2
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
  useEffect(() => {
    const margin = { top: 30, right: 20, bottom: 60, left: 50 }
    const innerWidth = width - margin.left - margin.right
    const adjustedInnerWidth = innerWidth - 10
    const innerHeight = height - margin.top - margin.bottom

    const svg = d3.select(ref.current)
    svg.selectAll("*").remove()

    const g = svg
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`)

    const x = d3
      .scaleBand()
      .domain(data.map((d) => d.label))
      .range([0, adjustedInnerWidth])
      .padding(barPadding)

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.data.totalReservations)])
      .nice()
      .range([innerHeight, 0])

    g.append("g")
      .call(d3.axisLeft(y).ticks(5))
      .selectAll("text")
      .style("font-size", "10px")

    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .style("font-size", "10px")
      .attr("text-anchor", "middle")

    const bars = g
      .selectAll(".bar")
      .data(data)
      .enter()
      .append("g")
      .attr("transform", (d) => `translate(${x(d.label)},0)`)
      .on("mouseover", function (event, d) {
        const index = data.findIndex((x) => x.label === d.label)
        const prev = index > 0 ? data[index - 1].data : null
        const noShow = d.data.totalReservations - d.data.reservationsAttended
        const prevNoShow = prev
          ? prev.totalReservations - prev.reservationsAttended
          : null
        const noShowRate = (noShow / d.data.totalReservations) * 100
        const prevNoShowRate = prev
          ? (prevNoShow / prev.totalReservations) * 100
          : null

        d3.select(tooltipRef.current)
          .style("display", "block")
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 50}px`)
          .html(
            `<div class='p-2 text-center '>
          <div class='mb-1'>Group Size:</div>
          <div class='flex justify-center mb-1'>${
            document.getElementById(`users-${d.label}`).innerHTML
          }</div>
          <strong>${d.data.averagePax.toFixed(1)}</strong>${formatChange(
              d.data.averagePax,
              prev?.averagePax
            )}
        </div>` +
              `<div class='p-2'><div class='mb-1'>Total Reservations:</div>
          <strong>${d.data.totalReservations}</strong>${formatChange(
                d.data.totalReservations,
                prev?.totalReservations
              )}
        </div>
        <div class='p-2'><div class='mb-1'>Reservations Attended:</div>
          <strong>${d.data.reservationsAttended}</strong>${formatChange(
                d.data.reservationsAttended,
                prev?.reservationsAttended
              )}
        </div>
        <div class='p-2'><div class='mb-1'>No Show Reservations:</div>
          <strong>${noShow}</strong>${formatChange(noShow, prevNoShow, true)}
        </div>
        <div class='p-2'><div class='mb-1'>No Show Rate:</div>
          <strong>${noShowRate.toFixed(1)}%</strong>${formatChange(
                noShowRate,
                prevNoShowRate,
                true
              )}
        </div>`
          )
      })
      .on("mousemove", function (event) {
        d3.select(tooltipRef.current)
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 50}px`)
      })
      .on("mouseout", function () {
        d3.select(tooltipRef.current).style("display", "none")
      })

    bars
      .append("rect")
      .attr("y", y(0))
      .attr("height", 0)
      .attr("width", x.bandwidth())
      .attr("fill", "#ffe4b5")
      .transition()
      .duration(700)
      .attr("y", (d) => y(d.data.totalReservations))
      .attr("height", (d) => innerHeight - y(d.data.totalReservations))

    bars
      .append("rect")
      .attr("y", y(0))
      .attr("height", 0)
      .attr("width", x.bandwidth())
      .attr("fill", "#ff7f50")
      .transition()
      .duration(700)
      .attr("y", (d) => y(d.data.reservationsAttended))
      .attr("height", (d) => innerHeight - y(d.data.reservationsAttended))
  }, [data])

  return (
    <>
      <svg ref={ref}></svg>
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
      <div style={{ display: "none" }}>
        {data.map((d) => (
          <div
            key={d.label}
            id={`users-${d.label}`}
            className="flex flex-col items-center"
          >
            <Users className="w-6 h-6 mb-1 text-blue-500" />
          </div>
        ))}
      </div>
    </>
  )
}

export default ReservationBarGraph
