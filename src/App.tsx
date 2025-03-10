import React, {useMemo, useState} from 'react';
import './App.css';

import BarGraph from "./components/BarGraph";
import CompareList from "./components/CompareList";
import DateSelect from "./components/DateSelect";
import FileInput from "./components/FileInput";
import Help from "./components/Help";

import Reducer, * as Actions from "./reducers/App";

import * as Types from './reducers/Types';

type GraphData = {
  maxIn: number;
  maxOut: number;
  inValues: boolean;
  outValues: boolean;
}

function App() {
  const [state, dispatch] = Reducer();
  const [showHelp, setShowHelp] = useState(false);
  const [showPowerIn, setShowPowerIn] = useState(true);
  const [showPowerOut, setShowPowerOut] = useState(false);

  const importFile = (file:File) => dispatch(Actions.importFile(file));
  const selectDate = (date:Date) => dispatch(Actions.selectDate(date));
  const storeDate = (date:Date, name:string) => dispatch(Actions.storeDate(date, name));
  const compareDate = (name:string | null) => dispatch(Actions.compareDate(name));
  const deleteDate = (name:string) => dispatch(Actions.deleteDate(name));
  const selectHour = (hour:number) => dispatch(Actions.selectHour(hour));
  const deselectHour = (hour:number) => dispatch(Actions.deselectHour(hour));

  const graphData:GraphData = useMemo(() => {
    const retVal:GraphData = {
      maxIn: 0,
      maxOut: 0,
      inValues: false,
      outValues: false,
    }

    state.records?.forEach((record) => {
      record.forEach((entry) => {
        if (retVal.inValues || entry.kWhIn > 0) retVal.inValues = true;
        if (retVal.outValues || entry.kWhOut > 0) retVal.outValues = true;
        if (retVal.inValues && entry.kWhIn > retVal.maxIn) retVal.maxIn = entry.kWhIn;
        if (retVal.outValues && entry.kWhOut > retVal.maxOut) retVal.maxOut = entry.kWhOut;
      })
    });
    return retVal;
    // we have to use state.records.length or this doesn't work properly...
    //eslint-disable-next-line
  }, [state.records, state.records?.size])

  const dates = useMemo(() => {
    const dates:Date[] = Array(0);
    if (state.records == null) return dates;
    state.records.forEach((_, recordDate) => {
      if (dates.find((entry) => entry.getTime() === recordDate)) return;
      dates.push(new Date(recordDate));
    })
    return dates;
    // we have to use state.records.length or this doesn't work properly...
    //eslint-disable-next-line
  }, [state.records, state.records?.size])

  const dateRecords = useMemo(() => {
    return state.showDate == null ? new Map<number, Types.PowerEntry>() : state.records?.get(state.showDate.getTime());
  }, [state.records, state.showDate]);

  const compareRecords = useMemo(() => {
    if (state.compareRecords == null) return null;
    if (state.selectedCompareRecord == null) return null;
    const records = state.compareRecords.get(state.selectedCompareRecord);
    if (records == null) return null;
    return records;
  }, [state.selectedCompareRecord, state.compareRecords]);

  if (showHelp) {
    return (
      <div className="help">
        <Help/>
        <button onClick={() => setShowHelp(false)}>Back to App</button>
      </div>
    );
  } else {
    return (
      <div className="App">
      <button onClick={() => setShowHelp(true)}>Help</button>
        <div id="headerControls">
          <div className="headerPanel">
            <FileInput
              busy={state.busy}
              filename={state.filename}
              recordCount={state.records != null ? state.records.size : 0}
              importFile={importFile}/>
            <div>
              <div key="Show Inputs">
                <input type="checkbox" checked={showPowerIn} disabled={!graphData.inValues}
                       onClick={() => setShowPowerIn(!showPowerIn)}/>
                Show Power In
              </div>
              <div key="Show Outputs">
                <input type="checkbox" checked={showPowerOut} disabled={!graphData.outValues}
                       onClick={() => setShowPowerOut(!showPowerOut)}/>
                Show Power Out
              </div>
            </div>
          </div>
          <div className="panel">
            Compare List
            <CompareList
              currentDate={state.showDate}
              records={state.compareRecords}
              selectedRecord={state.selectedCompareRecord}
              selectRecord={compareDate}
              storeDate={storeDate}
              deleteDate={deleteDate}
            />
          </div>
        </div>
        <BarGraph
          records={dateRecords}
          compareRecords={compareRecords}
          maxInPower={graphData.maxIn}
          maxOutPower={graphData.maxOut}
          showInPower={showPowerIn}
          showOutPower={showPowerOut}
          selectedHours={state.selectedHours}
          selectHour={selectHour}
          deselectHour={deselectHour}
        />
        <DateSelect dates={dates} currentDate={state.showDate} selectDate={selectDate}/>
      </div>
    );
  }
}

export default App;
