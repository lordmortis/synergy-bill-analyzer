import React from "react";

interface IProps {
  dates: Date[];
  currentDate: Date | null;
  selectDate: (date:Date)=>void;
}

export default function DateSelect(props:IProps) : React.ReactElement {

  function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    props.selectDate(props.dates[parseInt(event.target.value, 10)]);
  }

  function dateClick(newIndex:number) {
    return () => props.selectDate(props.dates[newIndex])
  }

  if (props.dates.length === 0) {
    return <div>
      <button disabled>Left</button>
      <input type="range" min="0" max="0" value="0"/>
      <button disabled>Right</button>
    </div>
  } else {
    let index = props.currentDate != null ? props.dates.indexOf(props.currentDate) : 0;
    if (index === -1) index = 0;
    const leftEnabled = index > 0;
    const rightEnabled = index < props.dates.length - 1;

    return <div>
      <button disabled={!leftEnabled} onClick={dateClick(index - 1)}>Left</button>
      <input type="range" min="0" max={props.dates.length - 1} onChange={onChange} value={index}/>
      <button disabled={!rightEnabled} onClick={dateClick(index + 1)}>Right</button><br/>
      <span>{props.dates[index].toDateString()}</span>
    </div>
  }


}