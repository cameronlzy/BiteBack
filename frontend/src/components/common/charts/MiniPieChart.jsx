import { useEffect, useRef } from "react"
import * as d3 from "d3"

const MiniPieChart = ({
  data,
  width = 100,
  height = 100,
  showLabels = true,
}) => {
  const ref = useRef()

  useEffect(() => {
    const svg = d3.select(ref.current)
    svg.selectAll("*").remove()

    const radius = Math.min(width, height) / 2
    const colour = d3
      .scaleOrdinal()
      .domain(data.map((d) => d.label))
      .range(["#ff4f0f", "#ffa673", "#ffe3bb"])

    const pie = d3.pie().value((d) => d.value)
    const arc = d3.arc().innerRadius(0).outerRadius(radius)
    const labelArc = d3
      .arc()
      .innerRadius(radius * 0.5)
      .outerRadius(radius * 0.5)

    const chart = svg
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`)

    const pieData = pie(data)

    chart
      .selectAll("path")
      .data(pieData)
      .join("path")
      .attr("d", arc)
      .attr("fill", (d) => colour(d.data.label))
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
      chart
        .selectAll("text")
        .data(pieData)
        .join("text")
        .attr("transform", (d) => `translate(${labelArc.centroid(d)})`)
        .attr("font-family", "monospace")
        .attr("text-anchor", "middle")
        .attr("alignment-baseline", "middle")
        .attr("font-size", "12px")
        .attr("fill", "#000")
        .text((d) => d.data.label.split(" ")[0])
    }
  }, [data, width, height, showLabels])

  return (
    <svg
      ref={ref}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ maxWidth: "100%", height: "auto" }}
    />
  )
}

export default MiniPieChart
