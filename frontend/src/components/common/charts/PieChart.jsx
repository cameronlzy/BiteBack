import { useEffect, useRef } from "react"
import * as d3 from "d3"

const PieChart = ({
  data,
  width = 300,
  height = 300,
  innerRadius = 0,
  showLabels = true,
}) => {
  const ref = useRef()
  const tooltipRef = useRef()
  const padding = 10

  useEffect(() => {
    const radius = Math.min(width, height) / 2 - padding
    const total = d3.sum(data, (d) => d.value)

    const svg = d3.select(ref.current)
    svg.selectAll("*").remove()

    const chart = svg
      .attr("width", width + padding * 2)
      .attr("height", height + padding * 2)
      .append("g")
      .attr(
        "transform",
        `translate(${(width + padding * 2) / 2}, ${(height + padding * 2) / 2})`
      )

    const colour = d3
      .scaleOrdinal()
      .domain(data.map((d) => d.label))
      .range(["#ff4f0f", "#ffa673", "#ffe3bb"])

    const pie = d3.pie().value((d) => d.value)
    const arc = d3.arc().innerRadius(innerRadius).outerRadius(radius)

    const arcs = chart.selectAll("arc").data(pie(data)).enter().append("g")

    arcs
      .append("path")
      .attr("d", arc)
      .attr("fill", (d) => colour(d.data.label))
      .attr("stroke", "#fff")
      .attr("stroke-width", "1px")
      .on("mouseover", function (event, d) {
        const percent = ((d.data.value / total) * 100).toFixed(1)
        d3.select(tooltipRef.current)
          .style("display", "block")
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px")
          .html(
            `<div style="font-weight: bold; font-size: 14px;">${d.data.label}</div>
          <hr style="margin: 6px 0;" />
          <div>Number: <strong>${d.data.value}</strong></div>
          <div>Percentage: ${percent}%</div>`
          )
      })
      .on("mousemove", function (event) {
        d3.select(tooltipRef.current)
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px")
      })
      .on("mouseout", function () {
        d3.select(tooltipRef.current).style("display", "none")
      })
      .transition()
      .duration(700)
      .attrTween("d", function (d) {
        const interpolate = d3.interpolate(
          { startAngle: d.startAngle, endAngle: d.startAngle },
          d
        )
        return function (t) {
          return arc(interpolate(t))
        }
      })

    if (showLabels) {
      arcs
        .append("text")
        .attr("transform", (d) => `translate(${arc.centroid(d)})`)
        .attr("dy", "0.35em")
        .style("text-anchor", "middle")
        .style("font-size", "12px")
        .style("fill", "#000")
        .style("pointer-events", "none")
        .text((d) => d.data.label)
    }
  }, [data, width, height, innerRadius, showLabels])

  const colour = d3
    .scaleOrdinal()
    .domain(data.map((d) => d.label))
    .range(["#ff4f0f", "#ffa673", "#ffe3bb"])

  return (
    <div className="w-full flex flex-col items-center">
      <svg
        ref={ref}
        viewBox={`0 0 ${width + padding * 2} ${height + padding * 2}`}
        preserveAspectRatio="xMidYMid meet"
        className="block mx-auto"
      />
      <div
        ref={tooltipRef}
        style={{
          position: "absolute",
          display: "none",
          backgroundColor: "white",
          padding: "6px 12px",
          border: "1px solid #ddd",
          borderRadius: "6px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
          fontSize: "12px",
          fontFamily: "monospace",
          zIndex: 1000,
        }}
      />
      <div className="mt-3 flex flex-wrap justify-center gap-3">
        {data.map((d) => (
          <div key={d.label} className="flex items-center gap-2 text-sm">
            <div
              style={{
                width: 12,
                height: 12,
                backgroundColor: colour(d.label),
                borderRadius: 2,
              }}
            />
            <span>{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default PieChart
