import React, {useMemo, useState} from 'react';
import './App.css';

import BarGraph from "./components/BarGraph";
import DateSelect from "./components/DateSelect";
import FileInput from "./components/FileInput";
import Reducer, * as Actions from "./reducers/App";
import {Entry} from "./worker/format/Types";

type GraphData = {
  maxIn: number;
  maxOut: number;
  inValues: boolean;
  outValues: boolean;
}

function App() {
  const [state, dispatch] = Reducer();
  const [showPowerIn, setShowPowerIn] = useState(true);
  const [showPowerOut, setShowPowerOut] = useState(false);

  const importFile = (file:File) => dispatch(Actions.importFile(file));
  const selectDate = (date:Date) => dispatch(Actions.selectDate(date));

  const graphData:GraphData = useMemo(() => {
    const retVal:GraphData = {
      maxIn: 0,
      maxOut: 0,
      inValues: false,
      outValues: false,
    }
    state.records?.forEach((record) => {
      if (retVal.inValues || record.kWhIn > 0) retVal.inValues = true;
      if (retVal.outValues || record.kWhOut > 0) retVal.outValues = true;
      if (retVal.inValues && record.kWhIn > retVal.maxIn) retVal.maxIn = record.kWhIn;
      if (retVal.outValues && record.kWhOut > retVal.maxOut) retVal.maxOut = record.kWhOut;
    });
    return retVal;
    // we have to use state.records.length or this doesn't work properly...
    //eslint-disable-next-line
  }, [state.records, state.records?.length])

  const dates = useMemo(() => {
    const dates:Date[] = Array(0);
    if (state.records == null) return dates;
    state.records.forEach((record) => {
      if (dates.find((entry) => entry.getTime() === record.date.getTime())) return;
      dates.push(record.date);
    })
    return dates;
    // we have to use state.records.length or this doesn't work properly...
    //eslint-disable-next-line
  }, [state.records, state.records?.length])

  const dateRecords = useMemo(() => {
    const records:Entry[] = Array(0);
    state.records?.forEach((record) => {
      if (state.showDate?.getTime() !== record.date.getTime()) return;
      records.push(record);
    })
    return records;
  }, [state.records, state.showDate]);

  return (
    <div className="App">
      <FileInput
        busy={state.busy}
        filename={state.filename}
        recordCount={state.records != null ? state.records.length : 0}
        importFile={importFile}/>
      <div>
        <div key="Show Inputs">
          <input type="checkbox" checked={showPowerIn} disabled={!graphData.inValues} onClick={() => setShowPowerIn(!showPowerIn)}/>
          Show Power In
        </div>
        <div key="Show Outputs">
          <input type="checkbox" checked={showPowerOut} disabled={!graphData.outValues} onClick={() => setShowPowerOut(!showPowerOut)}/>
          Show Power Out
        </div>
      </div>
      <BarGraph
        records={dateRecords}
        maxInPower={graphData.maxIn}
        maxOutPower={graphData.maxOut}
        showInPower={showPowerIn}
        showOutPower={showPowerOut}
      />
      <DateSelect dates={dates} currentDate={state.showDate} selectDate={selectDate}/>
    </div>
  );
}

export default App;
