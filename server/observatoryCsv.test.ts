import { describe, expect, it } from "vitest";
import { parseObservatoryCsv } from "../shared/observatoryCsv";

describe("parseObservatoryCsv", () => {
  it("parses BOM, CRLF, optional fields, and quoted commas", () => {
    const rows = parseObservatoryCsv('\uFEFFindicator_code,observation_date,value,value_label,period_label,methodology_version,notes\r\nAI-USE,2026-01-01,12.5,,2026,"1.0","Survey, annual"');
    expect(rows).toEqual([{
      indicatorCode: "AI-USE",
      observationDate: "2026-01-01",
      value: "12.5",
      periodLabel: "2026",
      methodologyVersion: "1.0",
      notes: "Survey, annual",
    }]);
  });

  it("supports a text value and doubled quotes", () => {
    const rows = parseObservatoryCsv('indicator_code,observation_date,value_label,methodology_version,notes\nAI-QUAL,2026-02-01,"Level ""high""",1.1,');
    expect(rows[0]?.valueLabel).toBe('Level "high"');
  });

  it("parses and validates provenance and verification fields", () => {
    const rows = parseObservatoryCsv("indicator_code,observation_date,value,methodology_version,observation_kind,collection_method,source_timestamp,confidence,verification_status\nAI-USE,2026-01-01,12.5,1.0,estimate,Survey,2026-01-15T00:00:00Z,87.5,reviewed");
    expect(rows[0]).toMatchObject({ observationKind: "estimate", collectionMethod: "Survey", sourceTimestamp: "2026-01-15T00:00:00Z", confidence: "87.5", verificationStatus: "reviewed" });
    expect(() => parseObservatoryCsv("indicator_code,observation_date,value,methodology_version,confidence\nA,2026-01-01,1,1.0,101")).toThrow(/confidence/);
  });

  it("rejects unsupported headers and ambiguous values", () => {
    expect(() => parseObservatoryCsv("indicator_code,observation_date,methodology_version,secret\nA,2026-01-01,1,x")).toThrow(/Unsupported/);
    expect(() => parseObservatoryCsv("indicator_code,observation_date,value,value_label,methodology_version\nA,2026-01-01,2,two,1")).toThrow(/exactly one/);
  });

  it("rejects malformed and oversized imports", () => {
    expect(() => parseObservatoryCsv('indicator_code,observation_date,value,methodology_version\nA,2026-01-01,"12,1')).toThrow(/unterminated/);
    expect(() => parseObservatoryCsv('indicator_code,observation_date,value,methodology_version\nA,2026-01-01,"12"x,1')).toThrow(/Unexpected character/);
    const rows = Array.from({ length: 201 }, (_, i) => `A,2026-01-01,${i},1.0`).join("\n");
    expect(() => parseObservatoryCsv(`indicator_code,observation_date,value,methodology_version\n${rows}`)).toThrow(/200/);
  });
});
