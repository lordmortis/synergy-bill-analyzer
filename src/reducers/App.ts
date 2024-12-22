import React, {useMemo, useReducer} from "react";

import * as ImportWorker from "../worker/ImportWorker";
import * as WorkerTypes from "../worker/format/Types";
import * as Types from './Types';

type State = {
  busy: boolean;
  filename: string | null;
  records: Types.ParsedRecords;
  recordsProcessed: number;
  showDate: Date | null;
}

export const initialState:State = {
  busy: false,
  filename: null,
  records: new Map<number, Types.DateEntries>(),
  recordsProcessed: 0,
  showDate: null,
}

enum ActionType {
  ShowDate,
  ImportFile,
  ImportHasStarted,
  ImportHasEnded,
  ImportHasNewRecord,
}

export function importFile(file: File) {
  return {
    type: ActionType.ImportFile, file
  } as const
}

export function selectDate(date:Date) {
  return {
    type: ActionType.ShowDate, date
  } as const
}

function importStarted() {
  return {
    type: ActionType.ImportHasStarted
  } as const
}

function importCompleted() {
  return {
    type: ActionType.ImportHasEnded
  } as const
}

function addRecords(records: ImportedRecord[], startingRecordNumber: number) {
  return {
    type: ActionType.ImportHasNewRecord, records, startingRecordNumber
  } as const
}

type Action = ReturnType<
  typeof importFile | typeof selectDate
  | typeof importStarted | typeof importCompleted | typeof addRecords
>

type ImportedRecord = WorkerTypes.ProcessedEntry;

const synergyImporter : Worker = new Worker( new URL("../worker/ImportWorker.ts", import.meta.url));

function AddRecords(
  records: Types.ParsedRecords, recordsProcessed: number,
  newRecords: ImportedRecord[], startingRecordNumber: number) : Types.ParsedRecords {
  if (recordsProcessed > startingRecordNumber) return records;

  for(let index:number = 0; index < newRecords.length; index++) {
    const newRecord = newRecords[index];
    let entries:Types.DateEntries | undefined = records.get(newRecord.date.getTime());
    if (entries === undefined) {
      entries = new Map<number, Types.PowerEntry>();
      records.set(newRecord.date.getTime(), entries);
    }
    entries.set(newRecord.time, {hour: newRecord.time, kWhIn: newRecord.kWhIn, kWhOut: newRecord.kWhOut});
  }

  return records;
}

function SetDate(showDate: Date | null, records: Types.ParsedRecords | null) : Date | null {
  if (records == null) return null;
  if (records.size === 0) return null;
  if (showDate != null) return showDate;
  return new Date(Array.from(records.keys())[0]);
}

function reducer(state:State, action:Action) {
  switch(action.type) {
    case ActionType.ImportFile:
      synergyImporter.postMessage(action.file);
      return state;
    case ActionType.ShowDate:
      return {
        ...state,
        showDate: action.date,
      }
    case ActionType.ImportHasStarted:
      return {
        ...state,
        busy: true,
        records: new Map<number, Types.DateEntries>(),
        recordsProcessed: 0,
        showDate: null
      }
    case ActionType.ImportHasEnded:
      return {
        ...state,
        busy: false,
      }
    case ActionType.ImportHasNewRecord:
      return {
        ...state,
        records: AddRecords(state.records, state.recordsProcessed, action.records, action.startingRecordNumber),
        showDate: SetDate(state.showDate, state.records),
      }
    default:
      return state;
  }
}

export default function useUserReducer(startState = initialState): [State, React.Dispatch<Action>] {
  const [state, rawDispatch] = useReducer(reducer, startState);

  const wrappedDispatch = useMemo(
    () => {
      synergyImporter.onmessage = (e:MessageEvent<ImportWorker.Message>) => {
        switch(e.data.type) {
          case ImportWorker.MessageType.ImportStart:
            rawDispatch(importStarted())
            break;
          case ImportWorker.MessageType.ImportEnd:
            rawDispatch(importCompleted())
            break;
          case ImportWorker.MessageType.NewRecords:
            rawDispatch(addRecords(e.data.records, e.data.recordNumber))
            break;
        }
      }
      return rawDispatch;
    }, [rawDispatch]
  );


  return [state, wrappedDispatch];
}