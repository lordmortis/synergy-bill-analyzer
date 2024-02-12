import React, {useEffect, useRef} from "react";
import * as d3 from "d3";
import { Record } from "../reducers/App";

function findOrAppend(parent: d3.Selection<SVGSVGElement | SVGGElement, unknown, null, undefined>, type: string, className: string): d3.Selection<SVGGElement, unknown, null, undefined> {
  let searchVal = parent.select(`${type}.${className}`);
  if (searchVal.empty()) {
    searchVal = parent.append(type);
    searchVal.attr("class", className)
  }

  //@ts-ignore
  return searchVal
}

interface IProps {
  records: Record[];
  maxPower: number;
}

function convertRecordTime(record:Record): string {
  const time = record.time;
  const hourPart = Math.trunc(time).toLocaleString("en-AU", {minimumIntegerDigits: 2});
  const minutePart = (time % 1) > 0.01 ? "30" : "00";;
  return `${hourPart}:${minutePart}`;
}

export default function BarGraph(props:IProps) : React.ReactElement {
  const svgRef = useRef<SVGSVGElement>(null);
  const toolTipRef = useRef<HTMLDivElement>(null);

  const margin = {top: 20, right: 20, bottom: 30, left: 40};
  const width = (svgRef.current?.clientWidth === undefined ? 100 : svgRef.current?.clientWidth) - margin.left - margin.right;
  const height = (svgRef.current?.clientHeight === undefined ? 100 : svgRef.current?.clientHeight) - margin.top - margin.bottom;

  const x = d3.scaleBand().range([0, width]).padding(0.1);
  const y = d3.scaleLinear().range([height, 0]);

  useEffect(() => {
    if (svgRef.current === undefined) return;
    if (toolTipRef.current === null) return;
    const toolTipElement = d3.select(toolTipRef.current);
    const svgElement = d3.select(svgRef.current);
    if (svgElement.node() == null) return;
    //@ts-ignore
    let gElem = findOrAppend(svgElement, "g", "graph");
    gElem.attr("transform", `translate(${margin.left},${margin.top})`)

    x.domain(props.records.map(convertRecordTime));
    y.domain([0, props.maxPower]);
    y.nice();

    gElem.selectAll(".bar")
      .data(props.records)
      .join(
        (enter) =>
          enter.append("rect")
            .attr("class", "bar")
            .attr("x", (elem):number => x(convertRecordTime(elem)) !== undefined ? x(convertRecordTime(elem)) as number : 0)
            .attr("y", (elem) => y(elem.kWh))
            .attr("width", x.bandwidth)
            .attr("height", (elem) => height - y(elem.kWh))
            .on('mouseover',
              function (d, record) {
                d3.select(this).transition().duration(50).attr('opacity', '.5');
                toolTipElement.style('opacity', 1)
                  .style('left', `${d.clientX + 10}px`)
                  .style('top', `${d.clientY + 10}px`)
                  .text(`${record.kWh} kWh - ${convertRecordTime(record)}`)
            })
            .on('mouseout',
              function(d, record) {
                d3.select(this).transition().duration(50).attr('opacity', '1')
                toolTipElement.style('opacity', 0);
              })
        , update =>
          update.transition().duration(750)
            .attr("x", (elem):number => x(convertRecordTime(elem)) !== undefined ? x(convertRecordTime(elem)) as number : 0)
            .attr("y", (elem) => y(elem.kWh))
            .attr("width", x.bandwidth)
            .attr("height", (elem) => height - y(elem.kWh))
      )

    const xAxis = findOrAppend(gElem, "g", "xAxis");
    xAxis.attr("transform", `translate(0, ${height})`);
    xAxis.call(d3.axisBottom(x))
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-0.4em")
      .attr("dy", "-0.6em")
      .attr("transform", "rotate(-90)");

    const yAxis = findOrAppend(gElem, "g", "yAxis");
    yAxis.call(d3.axisLeft(y).ticks(4));

  }, [props.records, props.maxPower, margin.left, margin.top, width, height, x, y]);


  // @ts-ignore
  return (
      <div id="graph">
        <svg ref={svgRef} preserveAspectRatio="xMidYMid meet"></svg>
        <div ref={toolTipRef} id="tooltip"></div>
      </div>
  );
}

