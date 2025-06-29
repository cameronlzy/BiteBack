import * as d3 from "d3"
import { useEffect, useRef } from "react"

const LineChart = ({
  data,
  width = 800,
  height = 400,
  tooltipRef,
  onHoverPoint,
  colour = "#3b82f6",
  circleColour = "#3b82f6",
}) => {
  const ref = useRef()

  useEffect(() => {
    if (!data || data.length === 0) return

    const svg = d3.select(ref.current)
    svg.selectAll("*").remove()

    const margin = { top: 20, right: 30, bottom: 30, left: 40 }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    const x = d3
      .scaleTime()
      .domain(d3.extent(data, (d) => new Date(d.date)))
      .range([0, innerWidth])

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.value) * 1.1])
      .nice()
      .range([innerHeight, 0])

    const line = d3
      .line()
      .x((d) => x(new Date(d.date)))
      .y((d) => y(d.value))

    svg.attr("width", width).attr("height", height)

    svg
      .append("defs")
      .append("clipPath")
      .attr("id", "clip")
      .append("rect")
      .attr("width", innerWidth)
      .attr("height", innerHeight)

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`)

    const xAxisG = g
      .append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .attr("class", "x-axis")
      .call(d3.axisBottom(x).ticks(10).tickFormat(d3.timeFormat("%b %d")))
    g.append("g").attr("class", "y-axis").call(d3.axisLeft(y).ticks(5))

    const plotArea = g.append("g").attr("clip-path", "url(#clip)")

    const path = plotArea
      .append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", colour)
      .attr("stroke-width", 2)
      .attr("d", line)

    const totalLength = path.node().getTotalLength()
    path
      .attr("stroke-dasharray", `${totalLength} ${totalLength}`)
      .attr("stroke-dashoffset", totalLength)
      .transition()
      .duration(700)
      .attr("stroke-dashoffset", 0)

    const circles = plotArea
      .selectAll("circle")
      .data(data)
      .enter()
      .append("circle")
      .attr("r", 4)
      .attr("fill", circleColour)
      .attr("cx", (d) => x(new Date(d.date)))
      .attr("cy", (d) => y(d.value))
      .style("display", "none")
      .on("mouseover", function (event, d) {
        if (tooltipRef?.current) {
          onHoverPoint(event, d, data, tooltipRef.current)
        }
      })
      .on("mouseout", function () {
        if (tooltipRef?.current) {
          d3.select(tooltipRef.current).style("display", "none")
        }
      })

    const zoom = d3
      .zoom()
      .scaleExtent([1, 10])
      .translateExtent([
        [0, 0],
        [width, height],
      ])
      .extent([
        [0, 0],
        [width, height],
      ])
      .on("zoom", ({ transform }) => {
        const zx = transform.rescaleX(x)
        xAxisG.call(
          d3
            .axisBottom(zx)
            .ticks(Math.floor(innerWidth / 80))
            .tickFormat(d3.timeFormat("%b %d"))
        )
        path
          .interrupt()
          .attr("stroke-dasharray", null)
          .attr("stroke-dashoffset", null)
          .attr(
            "d",
            d3
              .line()
              .x((d) => zx(new Date(d.date)))
              .y((d) => y(d.value))(data)
          )

        const showDots =
          zx.domain()[1] - zx.domain()[0] <= 1000 * 60 * 60 * 24 * 30

        circles
          .style("display", showDots ? "block" : "none")
          .attr("cx", (d) => zx(new Date(d.date)))
          .attr("cy", (d) => y(d.value))
      })

    svg.call(zoom)
  }, [data])

  return <svg ref={ref} className="block mx-auto mt-2" />
}

export default LineChart
