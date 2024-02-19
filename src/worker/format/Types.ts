export enum ReadingStatusEnum {
  Unknown,
  NotAvailable,
  Actual
}

export type Entry = {
  date : Date;
  time : number;
  kWhIn : number;
  kWhOut : number;
  readingStatus: ReadingStatusEnum;
}

export interface Processor {
  reset: () => void;
  headerFound: (line:string[]) => boolean;
  processLine:(line:string[]) => Entry | null;
}