import { describe, expect, it } from "vitest";
import { rankAssessmentControls } from "./agarasDb";

describe("rankAssessmentControls", () => {
  const controls = [
    { id: 1, domainId: 10, code: "A-01", title: "General governance", objective: "Governance baseline", applicability: null, criticality: "moderate" },
    { id: 2, domainId: 10, code: "A-02", title: "Financial fraud controls", objective: "Banking risk", applicability: "Banking", criticality: "high" },
    { id: 3, domainId: 10, code: "A-03", title: "Clinical safety", objective: "Patient safety", applicability: "Healthcare", criticality: "critical" },
    { id: 4, domainId: 11, code: "B-01", title: "General transparency", objective: "Public accountability", applicability: null, criticality: "low" },
  ];

  it("prefers controls relevant to the selected sector while preserving domain coverage", () => {
    expect(rankAssessmentControls({ controls, sector: "banking", perDomain: 1 })).toEqual([2, 4]);
    expect(rankAssessmentControls({ controls, sector: "healthcare", perDomain: 1 })).toEqual([3, 4]);
  });

  it("adds regulated-sector and organization context without removing deterministic ordering", () => {
    expect(rankAssessmentControls({ controls, organizationType: "government_agency", regulatedSector: true, perDomain: 1 })).toEqual([3, 4]);
  });
});
