import React, {useEffect, useRef} from "react";
import * as d3 from "d3";
import * as Types from "../reducers/Types";
import {max} from "d3";

const ColorInBar:string = "#7036EC";
const ColorInBarSelected:string = "#FF16AC";
const ColorOutBar:string = "#A3E415";
const ColorOutBarSelected:string = "#A3E415";

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
  records: Types.DateEntries | undefined;
  compareRecords: Types.DateEntries | null;
  maxInPower: number;
  maxOutPower: number;
  showInPower: boolean;
  showOutPower: boolean;
  selectedHours: Array<number>;
  selectHour: (hour: number) => void;
  deselectHour: (hour: number) => void;
}

function convertRecordTime(entry:Types.PowerEntry): string {
  const hourPart = Math.trunc(entry.hour).toLocaleString("en-AU", {minimumIntegerDigits: 2});
  const minutePart = (entry.hour % 1) > 0.01 ? "30" : "00";
  return `${hourPart}:${minutePart}`;
}

function getkWhIn(elem: any, compareRecords: Types.DateEntries | null) : number {
  if (compareRecords != null) {
    const compareRecord = compareRecords.get(elem.hour);
    if (compareRecord != null) {
      return elem.kWhIn - compareRecord.kWhIn;
    }
  }

  return elem.kWhIn;
}

export default function BarGraph(props:IProps) : React.ReactElement {
  const svgRef = useRef<SVGSVGElement>(null);
  const toolTipRef = useRef<HTMLDivElement>(null);

  const margin = {top: 20, right: 20, bottom: 30, left: 40};
  const width = (svgRef.current?.clientWidth === undefined ? 100 : svgRef.current?.clientWidth) - margin.left - margin.right;
  const height = (svgRef.current?.clientHeight === undefined ? 100 : svgRef.current?.clientHeight) - margin.top - margin.bottom;

  const x = d3.scaleBand().range([0, width]).padding(0.1);
  const y = d3.scaleLinear().range([height, 0]);

  const {
    compareRecords, records, maxInPower, maxOutPower, showOutPower, showInPower, selectedHours,
    selectHour, deselectHour } = props;

/*  function(d, record) {
    console.log(selectedHours);
    if (selectedHours.indexOf(record.hour) === -1) {
      console.log("Selected hour");
      console.log(record.hour);
      selectHour(record.hour);
      d3.select(this).attr('fill', ColorOutBarSelected);
    } else {
      console.log("deselect hour");
      console.log(record.hour);
      deselectHour(record.hour);
      d3.select(this).attr('fill', ColorOutBar);
    }*/

  useEffect(() => {
    console.log("Redraw?");
    if (svgRef.current === undefined) return;
    if (toolTipRef.current === null) return;
    const toolTipElement = d3.select(toolTipRef.current);
    const svgElement = d3.select(svgRef.current);
    if (svgElement.node() == null) return;
    //@ts-ignore
    let gElem = findOrAppend(svgElement, "g", "graph");
    gElem.attr("transform", `translate(${margin.left},${margin.top})`)

    if (records === undefined) {
      x.domain([]);
    } else {
      x.domain(Array.from(records.values()).map(convertRecordTime));
    }
    if (showInPower) y.domain([0, maxInPower]);
    if (showOutPower) y.domain([0, maxOutPower]);
    if (showInPower && showOutPower) {
      let maxPower = max([maxInPower, maxOutPower]);
      if (maxPower === undefined) maxPower = 0;
      y.domain([0, maxPower]);
    }
    y.nice();

    const xWidth:number = (showInPower && showOutPower) ? (x.bandwidth()) / 2 : x.bandwidth();

    const HandleBarClick = (d:any, record: Types.PowerEntry) => {
      const elem = d.target;
      const selected = elem.dataset.selected === "true"
      if (!selected) {
        selectHour(record.hour);
        d3.select(elem).attr('fill', ColorInBarSelected);
      } else {
        deselectHour(record.hour);
        d3.select(elem).attr('fill', ColorInBar);
      }
    }

    gElem.selectAll(".barIn")
      .data(Array.from(records !== undefined ? records.values() : []))
      .join(
        (enter) =>
          enter.append("rect")
            .attr("class", "barIn")
            .attr("data-kwh", (elem):number => getkWhIn(elem, compareRecords))
            .attr("data-time", (elem):string => convertRecordTime(elem))
            .attr("data-selected", (elem):boolean => selectedHours.indexOf(elem.hour) !== -1)
            .attr("fill", (elem) => selectedHours.indexOf(elem.hour) === -1 ? ColorInBar : ColorInBarSelected)
            .attr("x", (elem):number => x(convertRecordTime(elem)) !== undefined ? x(convertRecordTime(elem)) as number : 0)
            .attr("y", (elem) => showInPower ? y(getkWhIn(elem, compareRecords)) : height)
            .attr("width", xWidth)
            .attr("height", (elem) => showInPower ? height - y(getkWhIn(elem, compareRecords)): 0)
            .on('mouseover',
              function (d, record) {
                let text = `${d.target.dataset.kwh} kWh - ${d.target.dataset.time}`;
                d3.select(this).transition().duration(50).attr('opacity', '.5');
                toolTipElement.style('opacity', 1)
                  .style('left', `${d.clientX + 10}px`)
                  .style('top', `${d.clientY + 10}px`)
                  .text(text);
              })
            .on('mouseout',
              function(d, record) {
                d3.select(this).transition().duration(50).attr('opacity', '1')
                toolTipElement.style('opacity', 0);
              })
            .on('click', HandleBarClick)
        , update =>
          update.transition().duration(750)
            .attr("data-kwh", (elem):number => getkWhIn(elem, compareRecords))
            .attr("data-selected", (elem):boolean => selectedHours.indexOf(elem.hour) !== -1)
            .attr("x", (elem):number => x(convertRecordTime(elem)) !== undefined ? x(convertRecordTime(elem)) as number : 0)
            .attr("y", (elem) => showInPower ? y(getkWhIn(elem, compareRecords)): height)
            .attr("width", xWidth)
            .attr("fill", (elem) => selectedHours.indexOf(elem.hour) === -1 ? ColorInBar : ColorInBarSelected)
            .attr("height", (elem) => showInPower ? height - y(getkWhIn(elem, compareRecords)): 0)
      )

    gElem.selectAll(".barOut")
      .data(Array.from(records !== undefined ? records.values() : []))
      .join(
        (enter) =>
          enter.append("rect")
            .attr("fill", (elem) => selectedHours.indexOf(elem.hour) === -1 ? ColorOutBar : ColorOutBarSelected)
            .attr("class", "barOut")
            .attr("x", (elem):number => {
              const convertedVal = x(convertRecordTime(elem));
              if (convertedVal === undefined) return 0;
              return showInPower ? convertedVal + x.bandwidth() / 2 : convertedVal;
            })
            .attr("y", (elem) => showOutPower ? y(elem.kWhOut): height)
            .attr("width", xWidth)
            .attr("height", (elem) => showOutPower ? height - y(elem.kWhOut): 0)
            .on('mouseover',
              function (d, record) {
                let text = `${record.kWhOut} kWh - ${convertRecordTime(record)}`;
                d3.select(this).transition().duration(50).attr('opacity', '.5');
                toolTipElement.style('opacity', 1)
                  .style('left', `${d.clientX + 10}px`)
                  .style('top', `${d.clientY + 10}px`)
                  .text(text);
              })
            .on('mouseout',
              function(d, record) {
                d3.select(this).transition().duration(50).attr('opacity', '1')
                toolTipElement.style('opacity', 0);
              })
            .on('click', HandleBarClick)
        , update =>
          update.transition().duration(750)
            .attr("x", (elem):number => {
              const convertedVal = x(convertRecordTime(elem));
              if (convertedVal === undefined) return 0;
              return showInPower ? convertedVal + x.bandwidth() / 2 : convertedVal;
            })
            .attr("y", (elem) => showOutPower ? y(elem.kWhOut): height)
            .attr("width", xWidth)
            .attr("height", (elem) => showOutPower ? height - y(elem.kWhOut): 0)
            .attr("fill", (elem) => selectedHours.indexOf(elem.hour) === -1 ? ColorOutBar : ColorOutBarSelected)
      );

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

  }, [
    compareRecords, records, maxInPower, maxOutPower, showOutPower, showInPower, selectedHours,
    deselectHour, selectHour, margin.left, margin.top, width, height, x, y
  ]);


  // @ts-ignore
  return (
      <div id="graph">
        <svg ref={svgRef} preserveAspectRatio="xMidYMid meet"></svg>
        <div ref={toolTipRef} id="tooltip"></div>
      </div>
  );
}

