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

export interface ExtraFields {
  date : Date;
  time : number;
  readingStatus: ReadingStatusEnum;
}

export type ProcessedEntry = Entry & ExtraFields;

export interface Processor {
  reset: () => void;
  headerFound: (line:string[]) => boolean;
  processLine:(line:string[]) => ProcessedEntry | null;
}