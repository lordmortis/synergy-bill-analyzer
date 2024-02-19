import {ReadingStatusEnum, Entry, Processor} from "./Types";

const fileTypes: FileType[] = [
  {
    headerFields: ["date", "time", "usage not yet billed", "usage already billed"],
    mapping: {
      date: (line) => parseDate(line[0]),
      time: (line) => parseTime(line[1]),
      kWhIn: (line) => parseBlankFloat(line[2]) + parseBlankFloat(line[3]),
      kWhOut: (line) => parseFloat(line[4])
    }
  },
  {
    headerFields: ["date", "time", "off peak", "peak", "super offpeak"],
    mapping: {
      date: (line) => parseDate(line[0]),
      time: (line) => parseTime(line[1]),
      kWhIn: (line) => parseBlankFloat(line[2]) + parseBlankFloat(line[3]) + parseBlankFloat(line[4]),
      kWhOut: (line) => 0
    }
  },
  {
    headerFields: ["date", "time", "off peak(am)", "super off peak", "peak", "off-peak"],
    mapping: {
      date: (line) => parseDate(line[0]),
      time: (line) => parseTime(line[1]),
      kWhIn: (line) => parseBlankFloat(line[2]) + parseBlankFloat(line[3]) + parseBlankFloat(line[4]) + parseBlankFloat(line[5]),
      kWhOut: (line) => 0
    }
  },
  {
    headerFields: ["date", "time", "kwh", "kw", "kva", "power factor"],
    mapping: {
      date: (line) => parseDate(line[0]),
      time: (line) => parseTime(line[1]),
      kWhIn: (line) => parseBlankFloat(line[2]),
      kWhOut: (line) => 0
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
  kWhOut: (line:string[]) => number
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
    case "actual": return ReadingStatusEnum.Actual;
    default: return ReadingStatusEnum.Unknown;
  }
}

function parseBlankFloat(string: string): number {
  const parsedVal = parseFloat(string)
  return Number.isFinite(parsedVal) ? parsedVal : 0;
}

function headerMatches(headerFields: string[], line: string[]) : [matches: boolean, generationIndex: number, statusIndex: number] {
  let generationIndex = -1;
  let statusIndex = -1;

  if (line.length < headerFields.length) return [false, generationIndex, statusIndex];

  for (let index = 0; index < line.length; index++) {
    const fieldName = line[index].toLowerCase();
    if (fieldName === "generation") {
      generationIndex = index;
      continue;
    }

    if (index < headerFields.length && fieldName !== headerFields[index]) {
      return [false, generationIndex, statusIndex];
    } else {
      statusIndex = index;
    }
  }

  return [true, generationIndex, statusIndex];
}

export class SynergyProcessor implements Processor {
  private currentFileType:FileType | null = null;
  private generationIndex:number = -1;
  private statusIndex:number = -1;

  public reset() {
    this.currentFileType = null;
    this.generationIndex = -1;
  }

  public headerFound(line:string[]): boolean {
    for (const fileType of fileTypes) {
      const [matches, generationIndex, statusIndex] = headerMatches(fileType.headerFields, line)
      if (!matches) continue;
      this.currentFileType = fileType;
      this.generationIndex = generationIndex;
      this.statusIndex = statusIndex;
      return true;
    }
    return false;
  }

  public processLine(line:string[]): Entry | null {
    if (this.currentFileType == null) return null;
    const mapping = this.currentFileType.mapping;
    const kWhOut = this.generationIndex === -1 ? 0 : parseBlankFloat(line[this.generationIndex]);
    const status = this.statusIndex === -1 ? ReadingStatusEnum.Unknown : parseStatus(line[this.statusIndex])
    return {
      date: mapping.date(line),
      time: mapping.time(line),
      kWhIn: mapping.kWhIn(line),
      kWhOut: kWhOut,
      readingStatus: status,
    }
  }
}