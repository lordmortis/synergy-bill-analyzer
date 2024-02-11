import React, {useState, useEffect, useRef, RefObject} from "react";
import * as d3 from "d3";

interface DataEntry {
  time : string,
  powerUsed: number,
}

function generateDataSet() : DataEntry[] {
  const timeData: DataEntry[] = Array(0);
  for (let hour = 0; hour < 24; hour++) {
    const entry1 : DataEntry = {
      time: hour.toLocaleString("en-AU", { minimumIntegerDigits: 2 }) + ":00",
      powerUsed: Math.random() * 3,
    };
    const entry2 : DataEntry = {
      time: hour.toLocaleString("en-AU", { minimumIntegerDigits: 2 }) + ":30",
      powerUsed: Math.random() * 3,
    }
    timeData.push(entry1);
    timeData.push(entry2);
  }

  return timeData;
}

function useInterval(callback : Function, delay : number | null) {
  const savedCallback = useRef(callback);
  useEffect(() => {
    savedCallback.current = callback
  }, [callback]);

  useEffect(() => {
    function tick() {
      savedCallback.current();
    }
    if (delay != null) {
      let id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

function findOrAppend(parent: d3.Selection<SVGSVGElement | SVGGElement, unknown, null, undefined>, type: string, className: string): d3.Selection<SVGGElement, unknown, null, undefined> {
  let searchVal = parent.select(`${type}.${className}`);
  if (searchVal.empty()) {
    searchVal = parent.append(type);
    searchVal.attr("class", className)
  }

  //@ts-ignore
  return searchVal
}

export default function BarGraph() : React.ReactElement {
  const margin = {top: 20, right: 20, bottom: 30, left: 40};
  const width = 1170 - margin.left - margin.right;
  const height = 150 - margin.top - margin.bottom;

  const [dataset, setDataset] = useState(generateDataSet());
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

    x.domain(dataset.map((elem) => elem.time));
    const max = d3.max(dataset, (elem) => elem.powerUsed);
    if (max !== undefined) y.domain([0, max]);
    y.nice();

    gElem.selectAll(".bar")
      .data(dataset)
      .join(
        (enter) =>
          enter.append("rect")
            .attr("class", "bar")
            .attr("x", (elem):number => x(elem.time) !== undefined ? x(elem.time) as number : 0)
            .attr("y", (elem) => y(elem.powerUsed))
            .attr("width", x.bandwidth)
            .attr("height", (elem) => height - y(elem.powerUsed))
        , update =>
          update.transition().duration(750)
            .attr("x", (elem):number => x(elem.time) !== undefined ? x(elem.time) as number : 0)
            .attr("y", (elem) => y(elem.powerUsed))
            .attr("width", x.bandwidth)
            .attr("height", (elem) => height - y(elem.powerUsed))
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

  }, [dataset, margin.left, margin.top, width, height, x, y]);

  useInterval(() => {
    const newDataSet = generateDataSet();
    setDataset(newDataSet);
  }, 2000);

  //@ts-ignore
  return <svg ref={ref}/>;
}

