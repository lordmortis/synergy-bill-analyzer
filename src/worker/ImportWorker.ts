import {SynergyProcessor} from './format/Synergy'

import {Entry, Processor} from "./format/Types";

export type {Entry} from "./format/Types";

const LFVal:number = 0x0A;
const CRVal:number = 0x0D;

const sendRecordsNum = 100;
const decoder = new TextDecoder();

const processors:Processor[] = [
  new SynergyProcessor(),
];

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

async function ReadData(reader:ReadableStreamDefaultReader<Uint8Array>) {
  const recordArray: Entry[] = Array(0);
  let recordCount = 0;
  let remainingBuffer: Uint8Array | null = null;
  let currentLineBuffer: string | null = null;
  let currentProcessor: Processor | null = null;

  let keepReading = true;
  while (keepReading) {
    let newRead = await reader.read()
    if (newRead.done) keepReading = false;
    if (newRead.value === undefined) continue;
    const newData = newRead.value;

    let offset = 0;
    let index = 0;
    let sawCR = false;
    if (newData.length === 0) continue;
    while (index <= newData.length) {
      switch (newData[index]) {
        case CRVal:
          sawCR = true;
          break;
        case LFVal:
          let decodeArray: Uint8Array;
          if (remainingBuffer != null) {
            decodeArray = new Uint8Array(remainingBuffer.length + (sawCR ? index - 1 : index - offset));
            decodeArray.set(remainingBuffer, 0);
            decodeArray.set(newData.subarray(offset, sawCR ? index - 1 : index), remainingBuffer.length);
            remainingBuffer = null;
          } else {
            decodeArray = newData.subarray(offset, sawCR ? index - 1 : index);
          }
          if (offset < index) currentLineBuffer = decoder.decode(decodeArray);
          offset = index + 1;
          sawCR = false;
          break;
      }
      index++;
      if (currentLineBuffer == null) continue;
      currentLineBuffer = currentLineBuffer.replaceAll("\"", "");
      currentLineBuffer = currentLineBuffer.toLowerCase();
      const currentLine = currentLineBuffer.split(",");
      currentLineBuffer = null;

      if (currentProcessor == null) {
        for (const processor of processors) {
          if (processor.headerFound(currentLine)) {
            currentProcessor = processor;
          }
        }
      } else {
        const newRecord = currentProcessor.processLine(currentLine);
        if (newRecord != null) recordArray.push(newRecord);
      }

    }
    if (offset < index) remainingBuffer = newData.subarray(offset, index);
    if (recordArray.length < sendRecordsNum) continue;
    postMessage(importedRecords(recordArray, recordCount));
    recordCount += recordArray.length;
    recordArray.splice(0);
  }

  if (recordArray.length === 0) return;
  postMessage(importedRecords(recordArray, recordCount));
}

function StartImport(file:File) {
  if (state.busy) {
    postMessage(errorMessage("Currently Busy"));
    return;
  }

  postMessage(importStart());
  state.busy = true;
  state.currentFile = file.name;

  ReadData(file.stream().getReader()).finally(() => {
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