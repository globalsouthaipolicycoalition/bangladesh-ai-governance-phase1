export type ObservatoryCsvRow = {
  indicatorCode: string;
  observationDate: string;
  value?: string;
  valueLabel?: string;
  periodLabel?: string;
  methodologyVersion: string;
  notes?: string;
  observationKind?: "reported" | "estimate" | "projection";
  collectionMethod?: string;
  sourceTimestamp?: string;
  confidence?: string;
  verificationStatus?: "unverified" | "reviewed" | "independently_verified";
};

const REQUIRED_HEADERS = ["indicator_code", "observation_date", "methodology_version"] as const;
const OPTIONAL_HEADERS = ["value", "value_label", "period_label", "notes", "observation_kind", "collection_method", "source_timestamp", "confidence", "verification_status"] as const;
const ALLOWED_HEADERS = new Set<string>([...REQUIRED_HEADERS, ...OPTIONAL_HEADERS]);

function parseCsvMatrix(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  let afterClosingQuote = false;
  const text = input.replace(/^\uFEFF/, "");

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]!;
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
        afterClosingQuote = true;
      } else {
        cell += char;
      }
    } else if (afterClosingQuote && char !== "," && char !== "\n" && char !== "\r") {
      if (!/\s/.test(char)) throw new Error("Unexpected character after a closing CSV quote");
    } else if (char === '"') {
      if (cell.length) throw new Error("CSV quote must begin at the start of a field");
      quoted = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
      afterClosingQuote = false;
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i += 1;
      row.push(cell);
      if (row.some(value => value.trim())) rows.push(row);
      row = [];
      cell = "";
      afterClosingQuote = false;
    } else {
      cell += char;
    }
  }
  if (quoted) throw new Error("CSV contains an unterminated quoted field");
  row.push(cell);
  if (row.some(value => value.trim())) rows.push(row);
  return rows;
}

export function parseObservatoryCsv(input: string): ObservatoryCsvRow[] {
  const matrix = parseCsvMatrix(input);
  if (matrix.length < 2) throw new Error("CSV must include a header and at least one data row");
  const headers = matrix[0]!.map(value => value.trim().toLowerCase());
  if (new Set(headers).size !== headers.length) throw new Error("CSV headers must not be duplicated");
  const unknown = headers.filter(header => !ALLOWED_HEADERS.has(header));
  if (unknown.length) throw new Error(`Unsupported CSV column: ${unknown.join(", ")}`);
  const missing = REQUIRED_HEADERS.filter(header => !headers.includes(header));
  if (missing.length) throw new Error(`Missing required CSV columns: ${missing.join(", ")}`);
  if (!headers.includes("value") && !headers.includes("value_label")) {
    throw new Error("CSV must include a value or value_label column");
  }
  const index = new Map(headers.map((header, i) => [header, i]));
  const at = (row: string[], key: string) => row[index.get(key)!]?.trim() ?? "";
  const dataRows = matrix.slice(1);
  if (dataRows.length > 200) throw new Error("CSV may contain at most 200 observations per import");
  return dataRows.map((row, i) => {
    if (row.length !== headers.length) throw new Error(`CSV row ${i + 2} has ${row.length} fields; expected ${headers.length}`);
    const record: ObservatoryCsvRow = {
      indicatorCode: at(row, "indicator_code").toUpperCase(),
      observationDate: at(row, "observation_date"),
      methodologyVersion: at(row, "methodology_version"),
      ...(at(row, "value") ? { value: at(row, "value") } : {}),
      ...(at(row, "value_label") ? { valueLabel: at(row, "value_label") } : {}),
      ...(at(row, "period_label") ? { periodLabel: at(row, "period_label") } : {}),
      ...(at(row, "notes") ? { notes: at(row, "notes") } : {}),
      ...(at(row, "observation_kind") ? { observationKind: at(row, "observation_kind") as ObservatoryCsvRow["observationKind"] } : {}),
      ...(at(row, "collection_method") ? { collectionMethod: at(row, "collection_method") } : {}),
      ...(at(row, "source_timestamp") ? { sourceTimestamp: at(row, "source_timestamp") } : {}),
      ...(at(row, "confidence") ? { confidence: at(row, "confidence") } : {}),
      ...(at(row, "verification_status") ? { verificationStatus: at(row, "verification_status") as ObservatoryCsvRow["verificationStatus"] } : {}),
    };
    if (!record.indicatorCode || !record.observationDate || !record.methodologyVersion) {
      throw new Error(`CSV row ${i + 2} is missing indicator_code, observation_date, or methodology_version`);
    }
    if (Boolean(record.value) === Boolean(record.valueLabel)) {
      throw new Error(`CSV row ${i + 2} must provide exactly one of value or value_label`);
    }
    if (record.observationKind && !["reported", "estimate", "projection"].includes(record.observationKind)) throw new Error(`CSV row ${i + 2} has an invalid observation_kind`);
    if (record.verificationStatus && !["unverified", "reviewed", "independently_verified"].includes(record.verificationStatus)) throw new Error(`CSV row ${i + 2} has an invalid verification_status`);
    if (record.confidence && (!/^(100|[0-9]{1,2}(\.\d{1,2})?)$/.test(record.confidence) || Number(record.confidence) > 100)) throw new Error(`CSV row ${i + 2} has an invalid confidence`);
    if (record.sourceTimestamp && Number.isNaN(new Date(record.sourceTimestamp).getTime())) throw new Error(`CSV row ${i + 2} has an invalid source_timestamp`);
    return record;
  });
}
