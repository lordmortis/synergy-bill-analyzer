import React, {useMemo, useReducer} from "react";

import * as SynergyImporter from "../worker/ImportWorker";
import { MessageType } from "../worker/ImportWorker";
import { Entry } from "../worker/ImportWorker"

type State = {
  busy: boolean;
  filename: string | null;
  records: Entry[] | null;
  showDate: Date | null;
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

const synergyImporter : Worker = new Worker( new URL("../worker/ImportWorker.ts", import.meta.url));

function AddRecords(records: Entry[] | null, newRecords: ImportedRecord[], startingRecordNumber: number) : Entry[] {
  if (records == null) records = Array(0);
  if (records.length > startingRecordNumber) return records;

  for(let index:number = 0; index < newRecords.length; index++) {
    records.push(newRecords[index]);
  }

  return records;
}

function SetDate(showDate: Date | null, records: Entry[] | null) : Date | null {
  if (records == null) return null;
  if (records.length === 0) return null;
  if (showDate != null) return showDate;
  return records[0].date;
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
        records: AddRecords(state.records, action.records, action.startingRecordNumber),
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