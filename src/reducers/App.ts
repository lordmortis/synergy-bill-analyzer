import React, {useMemo, useReducer} from "react";

import * as SynergyImporter from "../worker/SynergyImportWorker";
import {MessageType} from "../worker/SynergyImportWorker";

type State = {
  busy: boolean;
  records: Record[] | null;
}

type Record = {
  date: Date;
  time: number;
  kWh: number;
}

export const initialState:State = {
  busy: false,
  records: Array(0),
}

enum ActionType {
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

function addRecord(record: ImportedRecord, recordNumber: number) {
  return {
    type: ActionType.ImportHasNewRecord, record, recordNumber
  } as const
}

type Action = ReturnType<
  typeof importFile | typeof importStarted | typeof importCompleted | typeof addRecord
>

type ImportedRecord = SynergyImporter.Entry;

const synergyImporter : Worker = new Worker( new URL("../worker/SynergyImportWorker.ts", import.meta.url));

function AddRecordTo(records: Record[] | null, record: ImportedRecord, recordNumber: number) : Record[] {
  if (records == null) records = Array(0);
  if (records.length >= recordNumber) return records;

  //TODO: handle multiple import types
  records.push({date: record.date, time: record.time, kWh: record.kWh })

  return records;
}

function reducer(state:State, action:Action) {
  switch(action.type) {
    case ActionType.ImportFile:
      synergyImporter.postMessage(action.file);
      return state;
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
        records: AddRecordTo(state.records, action.record, action.recordNumber),
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
          case MessageType.Record:
            rawDispatch(addRecord(e.data.record, e.data.recordNumber))
            break;
        }
      }
      return rawDispatch;
    }, [rawDispatch]
  );


  return [state, wrappedDispatch];
}