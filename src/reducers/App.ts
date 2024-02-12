import React, {useMemo, useReducer} from "react";

import * as SynergyImporter from "../worker/SynergyImportWorker";
import {MessageType} from "../worker/SynergyImportWorker";

type State = {
  busy: boolean;
  filename: string | null;
  records: Record[] | null;
  showDate: Date | null;
}

export type Record = {
  date: Date;
  time: number;
  kWh: number;
}

export const initialState:State = {
  busy: false,
  filename: null,
  records: Array(0),
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

type ImportedRecord = SynergyImporter.Entry;

const synergyImporter : Worker = new Worker( new URL("../worker/SynergyImportWorker.ts", import.meta.url));

function AddRecords(records: Record[] | null, newRecords: ImportedRecord[], startingRecordNumber: number) : Record[] {
  if (records == null) records = Array(0);
  if (records.length > startingRecordNumber) return records;

  for(let index:number = 0; index < newRecords.length; index++) {
    const newRecord = newRecords[index];
    records.push({date: newRecord.date, time: newRecord.time, kWh: newRecord.kWh });
  }

  return records;
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
        records: Array(0),
      }
    case ActionType.ImportHasEnded:
      return {
        ...state,
        busy: false,
      }
    case ActionType.ImportHasNewRecord:
      return {
        ...state,
        records: AddRecords(state.records, action.records, action.startingRecordNumber),
      }
    default:
      return state;
  }
}

export default function useUserReducer(startState = initialState): [State, React.Dispatch<Action>] {
  const [state, rawDispatch] = useReducer(reducer, startState);

  const wrappedDispatch = useMemo(
    () => {
      synergyImporter.onmessage = (e:MessageEvent<SynergyImporter.Message>) => {
        switch(e.data.type) {
          case MessageType.ImportStart:
            rawDispatch(importStarted())
            break;
          case MessageType.ImportEnd:
            rawDispatch(importCompleted())
            break;
          case MessageType.NewRecords:
            rawDispatch(addRecords(e.data.records, e.data.recordNumber))
            break;
        }
      }
      return rawDispatch;
    }, [rawDispatch]
  );


  return [state, wrappedDispatch];
}