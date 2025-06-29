import * as d3 from "d3"
import { useEffect, useRef } from "react"

const BarChart = ({
  data,
  width = 800,
  height = 400,
  onHoverPoint,
  tooltipRef,
  colourMap,
}) => {
  const ref = useRef()
  const internalTooltipRef = useRef()
  const actualTooltipRef = tooltipRef || internalTooltipRef

  const formatKey = (key) =>
    key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1")

  const stackedData = data.map((d) => {
    const noShow = d.values.total - d.values.attended
    return {
      ...d,
      stacked: [
        {
          key: "attended",
          value: d.values.attended,
          y0: 0,
          y1: d.values.attended,
        },
        {
          key: "noShow",
          value: noShow,
          y0: d.values.attended,
          y1: d.values.total,
        },
      ],
    }
  })
  const legendKeys = Object.keys(colourMap).filter((key) =>
    stackedData.some((d) => d.stacked.some((s) => s.key === key))
  )

  useEffect(() => {
    const margin = { top: 30, right: 20, bottom: 60, left: 50 }
    const innerWidth = width - margin.left - margin.right
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
      .range([0, innerWidth])
      .padding(0.2)

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.values.total)])
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

    const group = g
      .selectAll("g.bar-group")
      .data(stackedData)
      .enter()
      .append("g")
      .attr("transform", (d) => `translate(${x(d.label)},0)`)

    group
      .selectAll("rect")
      .data((d) => d.stacked.map((s) => ({ ...s, fullDatum: d })))
      .enter()
      .append("rect")
      .attr("x", 0)
      .attr("width", x.bandwidth())
      .attr("y", y(0))
      .attr("height", 0)
      .attr("fill", (d) => colourMap[d.key])
      .on("mouseover", (event, d) => {
        if (onHoverPoint && actualTooltipRef.current) {
          onHoverPoint(event, d.fullDatum, data, actualTooltipRef.current)
        }
      })
      .on("mousemove", (event) => {
        const tooltipEl = actualTooltipRef.current
        const tooltipHeight = tooltipEl.offsetHeight || 80
        const tooltipWidth = tooltipEl.offsetWidth || 120
        const buffer = 10

        let top = event.pageY - tooltipHeight - buffer
        if (top < window.scrollY + buffer) {
          top = event.pageY + buffer
        }

        let left = event.pageX + buffer
        if (left + tooltipWidth > window.innerWidth) {
          left = event.pageX - tooltipWidth - buffer
        }

        d3.select(tooltipEl)
          .style("display", "block")
          .style("left", `${left}px`)
          .style("top", `${top}px`)
      })
      .on("mouseout", () => {
        d3.select(actualTooltipRef.current).style("display", "none")
      })
      .transition()
      .duration(700)
      .attr("y", (d) => y(d.y1))
      .attr("height", (d) => y(d.y0) - y(d.y1))
  }, [data, height, width, onHoverPoint])

  return (
    <>
      <svg ref={ref}></svg>
      {!tooltipRef && (
        <div
          ref={internalTooltipRef}
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
      )}
      <div className="flex gap-2 mt-4 justify-center text-sm text-muted-foreground">
        {legendKeys.map((key) => (
          <div key={key} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-sm"
              style={{ backgroundColor: colourMap[key] }}
            />
            <span>{formatKey(key.charAt(0).toUpperCase() + key.slice(1))}</span>
          </div>
        ))}
      </div>
    </>
  )
}

export default BarChart
