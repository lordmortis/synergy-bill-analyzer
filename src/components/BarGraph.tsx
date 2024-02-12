import React, {useEffect, useRef, RefObject} from "react";
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
  return record.time.toString(10);
}

export default function BarGraph(props:IProps) : React.ReactElement {
  const margin = {top: 20, right: 20, bottom: 30, left: 40};
  const width = 1170 - margin.left - margin.right;
  const height = 150 - margin.top - margin.bottom;

  const ref : RefObject<SVGGElement | undefined> = useRef();

  const x = d3.scaleBand().range([0, width]).padding(0.1);
  const y = d3.scaleLinear().range([height, 0]);

  useEffect(() => {
    if (ref.current === undefined) return;
    const svgElement = d3.select(ref.current);
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
        , update =>
          update.transition().duration(750)
            .attr("x", (elem):number => x(convertRecordTime(elem)) !== undefined ? x(convertRecordTime(elem)) as number : 0)
            .attr("y", (elem) => y(elem.kWh))
            .attr("width", x.bandwidth)
            .attr("height", (elem) => height - y(elem.kWh))
      )

    if (gElem.select("g.xAxis").empty()) {
      gElem.append("g")
        .attr("class", "xAxis")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-0.4em")
        .attr("dy", "-0.6em")
        .attr("transform", "rotate(-90)")
    }

    const yAxis = findOrAppend(gElem, "g", "yAxis");
    yAxis.call(d3.axisLeft(y).ticks(4));

  }, [props.records, props.maxPower, margin.left, margin.top, width, height, x, y]);

  //@ts-ignore
  return <svg ref={ref}/>;
}

