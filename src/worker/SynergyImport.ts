import {line} from "d3";
import {Simulate} from "react-dom/test-utils";
import copy = Simulate.copy;

const LFVal:number = 0x0A;
const CRVal:number = 0x0D;

export enum ReadingStatusEnum {
  unknown,
  actual
}

export type Entry = {
  date : Date;
  time : number;
  kWh : number;
  kW : number;
  kVA : number;
  powerFactor: number;
  readingStatus: ReadingStatusEnum;
}

type State = {
  busy : boolean,
  currentFile : string | null,
  data : Entry[] | null,
}

export type Message = {
  state : State,
  importCount: number,
  error : string | null,
}

const state:State = {
  busy: false,
  currentFile: null,
  data: null,
};

function SendErrorUpdate(count: number,error:string) {
  const message:Message = {
    state: state,
    importCount: count,
    error: error,
  }
  // eslint-disable-next-line no-restricted-globals
  self.postMessage(message);
}

function SendUpdate(count: number) {
  const message:Message = {
    state: state,
    importCount: count,
    error: null
  }
  // eslint-disable-next-line no-restricted-globals
  self.postMessage(message);
}

function parseDate(string: string):Date {
  const parts = string.split("/");
  const theDate = new Date();
  theDate.setFullYear(
    parseInt(parts[2], 10),
    parseInt(parts[1], 10),
    parseInt(parts[0], 10)
  );
  return theDate;
}

function parseTime(string: string):number {
  const parts = string.split(":");
  let time = parseInt(parts[0], 10);
  if (parts[1] === "30") time += 0.5;
  return time;
}

function parseStatus(string: string):ReadingStatusEnum {
  switch(string.toLowerCase()) {
    case "actual": return ReadingStatusEnum.actual;
    default: return ReadingStatusEnum.unknown;
  }
}

function addData(lineBuffer: string): Entry {
  const parts = lineBuffer.split(",");
  return {
    date: parseDate(parts[0]),
    time: parseTime(parts[1]),
    kWh: parseFloat(parts[2]),
    kW: parseFloat(parts[3]),
    kVA: parseFloat(parts[4]),
    powerFactor: parseFloat(parts[5]),
    readingStatus: parseStatus(parts[6]),
  };
}

async function ReadData(stream:ReadableStream<Uint8Array>) {
  const decoder = new TextDecoder();

  let header = true;
  let lineBuffer:string | null = null;
  let remainingBuffer:Uint8Array | null = null;
  let entries:Entry[] = Array(0);

  // @ts-ignore
  for await (const chunk:Uint8Array of stream) {
    let offset = 0;
    let index = 0;
    let sawCR = false;
    if (chunk.length === 0) continue;
    while(index <= chunk.length) {
      if (chunk[index] === CRVal) {
        sawCR = true;
      } else if (chunk[index] === LFVal) {
        let decodeArray:Uint8Array;
        if (remainingBuffer != null) {
          decodeArray = new Uint8Array(remainingBuffer.length + (sawCR ? index - 1 : index - offset));
          decodeArray.set(remainingBuffer, 0);
          decodeArray.set(chunk.subarray(offset, sawCR ? index - 1 : index), remainingBuffer.length);
          remainingBuffer = null;
        } else {
          decodeArray = chunk.subarray(offset, sawCR ? index - 1 : index);
        }
        if (offset < index) lineBuffer = decoder.decode(decodeArray);
        offset = index + 1;
        sawCR = false;
      }
      index++;
      if (lineBuffer != null) {
        if (header) {
          if (lineBuffer.startsWith("Date,Time,kWh")) header = false;
        } else {
          entries.push(addData(lineBuffer));
          SendUpdate(entries.length);
        }
        lineBuffer = null;
      }
    }

    if (offset < index) remainingBuffer = chunk.subarray(offset, index);
  }

  state.data = entries;
}

function StartImport(file:File) {
  if (state.busy) {
    SendErrorUpdate(0, "Currently Busy");
    return;
  }

  state.busy = true;
  state.currentFile = file.name;
  state.data = null;
  console.log(`Beginning import run for: ${state.currentFile}`)

  ReadData(file.stream()).finally(() => {
    console.log(`Ending import run for: ${state.currentFile}`)
    state.busy = false;
    SendUpdate(state.data != null ? state.data.length : 0);
  })
}


// eslint-disable-next-line no-restricted-globals
self.onmessage = (e: MessageEvent<File>) => {
  StartImport(e.data);
}



export {};