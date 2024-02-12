import React, {useReducer} from "react";

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

export function importFile(file: File) {
  return {
    type: 'IMPORT_FILE', file
  } as const
}

function importStarted() {
  return {
    type: 'IMPORT_STARTED'
  } as const
}

function importCompleted() {
  return {
    type: 'IMPORT_COMPLETE'
  } as const
}

function addRecord(record: Record) {
  return {
    type: 'ADD_RECORD', record
  } as const
}

type Action = ReturnType<
  typeof importFile | typeof importStarted | typeof importCompleted | typeof addRecord
>

const synergyImporter : Worker = new Worker( new URL("../worker/SynergyImportWorker.ts", import.meta.url));

function reducer(state:State, action:Action) {
  switch(action.type) {
    case "IMPORT_FILE":
      synergyImporter.postMessage(action.file);
      return state;
    case "IMPORT_STARTED":
      return {
        ...state,
        busy: true,
      }
    case "IMPORT_COMPLETE":
      return {
        ...state,
        busy: false,
      }
    default:
      return state;
  }
}

export default function useUserReducer(startState = initialState): [State, React.Dispatch<Action>] {
  const [state, dispatch] = useReducer(reducer, startState);

  synergyImporter.onmessage = (e:MessageEvent<SynergyImporter.Message>) => {
    switch(e.data.type) {
      case MessageType.ImportStart:
        dispatch(importStarted())
        break;
      case MessageType.ImportEnd:
        dispatch(importCompleted())
        break;
      case MessageType.Record:
        break;
    }
  }

  return [state, dispatch];
}