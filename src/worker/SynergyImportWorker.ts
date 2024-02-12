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
}

const state:State = {
  busy: false,
  currentFile: null,
};

export enum MessageType {
  Unknown,
  ImportStart,
  ImportEnd,
  NewRecords,
  Error,
}

export type Message = ReturnType<
  typeof errorMessage | typeof importStart | typeof importEnd | typeof importedRecords
>

function errorMessage(error:string) {
  return {
    type: MessageType.Error,
    error: error,
  } as const;
}

function importStart() {
  return {
    type: MessageType.ImportStart,
  } as const;
}

function importEnd() {
  return {
    type: MessageType.ImportEnd,
  } as const;
}

function importedRecords(records:Entry[], recordNumber: number) {
  return {
    type: MessageType.NewRecords,
    records: records,
    recordNumber: recordNumber,
  } as const;
}

function postMessage(message:Message) {
  // eslint-disable-next-line no-restricted-globals
  self.postMessage(message);
}

function parseDate(string: string):Date {
  const parts = string.split("/");
  const theDate = new Date();
  theDate.setFullYear(
    parseInt(parts[2], 10),
    parseInt(parts[1], 10) - 1,
    parseInt(parts[0], 10)
  );
  theDate.setHours(0, 0, 1, 0);
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

function parse(lineBuffer: string): Entry {
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
  const sendRecordsNum = 100;
  const decoder = new TextDecoder();

  let header = true;
  let lineBuffer:string | null = null;
  let remainingBuffer:Uint8Array | null = null;
  let startingRecordNumber = 0;
  let recordNumber = 0;
  const recordArray:Entry[] = Array(0);

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
          recordArray.push(parse(lineBuffer));
          recordNumber++;
          if (recordArray.length >= sendRecordsNum) {
            postMessage(importedRecords(recordArray, startingRecordNumber))
            startingRecordNumber = recordNumber;
            recordArray.splice(0, recordArray.length);
          }
        }
        lineBuffer = null;
      }
    }

    if (offset < index) remainingBuffer = chunk.subarray(offset, index);
  }

  if (recordArray.length > 0) postMessage(importedRecords(recordArray, startingRecordNumber))
}

function StartImport(file:File) {
  if (state.busy) {
    postMessage(errorMessage("Currently Busy"));
    return;
  }

  postMessage(importStart());
  state.busy = true;
  state.currentFile = file.name;


  ReadData(file.stream()).finally(() => {
    state.busy = false;
    postMessage(importEnd());
    state.currentFile = null;
  })
}

// eslint-disable-next-line no-restricted-globals
self.onmessage = (e: MessageEvent<File>) => {
  if (typeof(e.data.stream) === "function") {
    StartImport(e.data);
  }
}

export {};