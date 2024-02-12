import React, {useMemo} from 'react';
import './App.css';

import BarGraph from "./components/BarGraph";
import DateSelect from "./components/DateSelect";
import FileInput from "./components/FileInput";
import Reducer, * as Actions from "./reducers/App";

function App() {
  const [state, dispatch] = Reducer();

  const importFile = (file:File) => dispatch(Actions.importFile(file));
  const selectDate = (date:Date) => dispatch(Actions.selectDate(date));

  const maxPower:number = useMemo(() => {
    let max = 0;
    state.records?.forEach((record) => {
      if (record.kWh > max) max = record.kWh;
    });
    return max;
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
    const records:Actions.Record[] = Array(0);
    state.records?.forEach((record) => {
      if (state.showDate?.getTime() !== record.date.getTime()) return;
      records.push(record);
    })
    return records;
  }, [state.records, state.showDate]);

  return (
    <div className="App">
      <header className="App-header">
        <FileInput
          busy={state.busy}
          filename={state.filename}
          recordCount={state.records != null ? state.records.length : 0}
          importFile={importFile}/>
        <BarGraph records={dateRecords} maxPower={maxPower}/>
        <DateSelect dates={dates} currentDate={state.showDate} selectDate={selectDate}/>
      </header>
    </div>
  );
}

export default App;
