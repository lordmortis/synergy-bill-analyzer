export interface PowerEntry {
  hour : number;
  kWhIn : number;
  kWhOut : number;
}

export type DateEntries = Map<number, PowerEntry>

export type ParsedRecords = Map<number, DateEntries>;

export type CompareRecords = Map<string, DateEntries>;