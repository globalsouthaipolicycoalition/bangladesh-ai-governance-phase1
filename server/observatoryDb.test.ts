import { describe, expect, it } from "vitest";
import { projectPublicObservatoryData } from "./observatoryDb";

describe("public Observatory response projection", () => {
  it("keeps publication values while omitting curation, actor and workflow metadata", () => {
    const indicators = [{
      id: 1, code: "TEST.1", title: "Public indicator", domain: "governance", sector: null,
      geographicCoverage: null, definition: "Public definition", unit: "count", dataType: "count",
      baselineValue: null, currentValue: "3", targetValue: "5", methodologyVersion: "1.0",
      active: true, createdBy: 900,
    }] as never;
    const observations = [{
      observation: {
        id: 2, observationDate: new Date("2026-01-01T00:00:00Z"), value: "3", valueLabel: null,
        periodLabel: "2026", methodologyVersion: "1.0", observationKind: "reported",
        verificationStatus: "reviewed", confidence: "80", notes: "Published caveat", publishedAt: new Date("2026-01-02T00:00:00Z"),
        verificationNotes: "internal reviewer note", verifiedBy: 901, createdBy: 902, publishedBy: 903, status: "published",
      },
      indicator: { ...indicators[0], reviewerNotes: "internal indicator note" },
      source: { id: 3, name: "Public source", publisher: "Publisher", url: "https://example.org", description: "internal description", createdBy: 904 },
    }] as never;

    const result = projectPublicObservatoryData({ indicators, observations, page: 1, pageSize: 25, total: 1 });
    expect(result.indicators[0]).toMatchObject({ id: 1, code: "TEST.1", title: "Public indicator" });
    expect(result.indicators[0]).not.toHaveProperty("createdBy");
    expect(result.observations[0]?.observation).toMatchObject({ id: 2, value: "3", verificationStatus: "reviewed" });
    for (const field of ["verificationNotes", "verifiedBy", "createdBy", "publishedBy", "status"]) {
      expect(result.observations[0]?.observation).not.toHaveProperty(field);
    }
    expect(result.observations[0]?.indicator).not.toHaveProperty("reviewerNotes");
    expect(result.observations[0]?.source).not.toHaveProperty("description");
    expect(result.observations[0]?.source).not.toHaveProperty("createdBy");
  });
});
