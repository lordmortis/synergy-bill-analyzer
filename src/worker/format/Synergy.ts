import * as Utils from './Types'
import {ReadingStatusEnum, Entry, Processor} from "./Types";

const fileTypes: FileType[] = [
  {
    headerFields: ["date", "time", "usage not yet billed", "usage already billed", "generation", "meter reading status"],
    mapping: {
      date: (line) => parseDate(line[0]),
      time: (line) => parseTime(line[1]),
      kWhIn: (line) => parseBlankFloat(line[2]) + parseBlankFloat(line[3]),
      kWhOut: (line) => parseFloat(line[4]),
      status: (line) => parseStatus(line[5]),
    }
  },
  {
    headerFields: ["date", "time", "off peak", "peak", "super offpeak", "meter reading status"],
    mapping: {
      date: (line) => parseDate(line[0]),
      time: (line) => parseTime(line[1]),
      kWhIn: (line) => parseBlankFloat(line[2]) + parseBlankFloat(line[3]) + parseBlankFloat(line[4]),
      kWhOut: (line) => 0,
      status: (line) => parseStatus(line[5]),
    }
  },
  {
    headerFields: ["date", "time", "off peak(am)", "super off peak", "peak", "off-peak", "meter reading status"],
    mapping: {
      date: (line) => parseDate(line[0]),
      time: (line) => parseTime(line[1]),
      kWhIn: (line) => parseBlankFloat(line[2]) + parseBlankFloat(line[3]) + parseBlankFloat(line[4]) + parseBlankFloat(line[5]),
      kWhOut: (line) => 0,
      status: (line) => parseStatus(line[6]),
    }
  },
  {
    headerFields: ["date", "time", "kwh", "kw", "kva", "power factor", "reading status"],
    mapping: {
      date: (line) => parseDate(line[0]),
      time: (line) => parseTime(line[1]),
      kWhIn: (line) => parseBlankFloat(line[2]),
      kWhOut: (line) => 0,
      status: (line) => parseStatus(line[6]),
    }
  }
]

type FileType = {
  headerFields: string[],
  mapping: MappingIndexes
}

type MappingIndexes = {
  date: (line:string[]) => Date,
  time: (line:string[]) => number,
  kWhIn: (line:string[]) => number,
  kWhOut: (line:string[]) => number,
  status: (line:string[]) => Utils.ReadingStatusEnum,
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

function parseBlankFloat(string: string): number {
  const parsedVal = parseFloat(string)
  return Number.isFinite(parsedVal) ? parsedVal : 0;
}

function headerMatches(headerFields: string[], line: string[]) {
  for (let index = 0; index < headerFields.length; index++) {
    if (line[index].toLowerCase() !== headerFields[index]) return false;
  }
  return true;
}

export default class implements Processor {
  private currentFileType: FileType | null = null;

  public reset() {
    this.currentFileType = null;
  }

  public headerFound(line:string[]): boolean {
    for (const fileType of fileTypes) {
      if (headerMatches(fileType.headerFields, line)) {
        this.currentFileType = fileType;
        return true;
      }
    }
    return false;
  }

  public processLine(line:string[]): Entry | null {
    if (this.currentFileType == null) return null;
    const mapping = this.currentFileType.mapping;
    return {
      date: mapping.date(line),
      time: mapping.time(line),
      kWhIn: mapping.kWhIn(line),
      kWhOut: mapping.kWhOut(line),
      readingStatus: mapping.status(line),
    }
  }
}