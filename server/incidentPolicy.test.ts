import { describe, expect, it } from "vitest";
import { canManageIncidents, canReadIncident, isAllowedIncidentEvidenceMimeType, isIncidentEvidenceStorageKey, isValidIncidentEvidenceSize } from "./incidentPolicy";

describe("incident access policy", () => {
  it("grants triage management only to owners, admins, and lead reviewers", () => {
    expect(canManageIncidents("owner")).toBe(true);
    expect(canManageIncidents("admin")).toBe(true);
    expect(canManageIncidents("lead_reviewer")).toBe(true);
    expect(canManageIncidents("reviewer")).toBe(false);
    expect(canManageIncidents("member")).toBe(false);
    expect(canManageIncidents(null)).toBe(false);
  });
  it("lets a reporter see their own incident but not another reporter's incident", () => {
    expect(canReadIncident(11, 11, false)).toBe(true);
    expect(canReadIncident(12, 11, false)).toBe(false);
  });
  it("lets an authorized manager see organization incidents", () => {
    expect(canReadIncident(12, 11, true)).toBe(true);
  });
  it("accepts only flat evidence object keys scoped to the exact organization and incident", () => {
    const key = "incident-evidence/7/12/8e9449cd-file.pdf";
    expect(isIncidentEvidenceStorageKey({ organizationId: 7, incidentId: 12, storageKey: key })).toBe(true);
    expect(isIncidentEvidenceStorageKey({ organizationId: 8, incidentId: 12, storageKey: key })).toBe(false);
    expect(isIncidentEvidenceStorageKey({ organizationId: 7, incidentId: 13, storageKey: key })).toBe(false);
    expect(isIncidentEvidenceStorageKey({ organizationId: 7, incidentId: 12, storageKey: `${key}/nested` })).toBe(false);
    expect(isIncidentEvidenceStorageKey({ organizationId: 7, incidentId: 12, storageKey: "incident-evidence/7/12/../secret" })).toBe(false);
  });
  it("allows only approved evidence MIME types and enforces a 10 MiB non-empty size limit", () => {
    expect(isAllowedIncidentEvidenceMimeType(" Application/PDF ")).toBe(true);
    expect(isAllowedIncidentEvidenceMimeType("image/svg+xml")).toBe(false);
    expect(isValidIncidentEvidenceSize(1)).toBe(true);
    expect(isValidIncidentEvidenceSize(10 * 1024 * 1024)).toBe(true);
    expect(isValidIncidentEvidenceSize(10 * 1024 * 1024 + 1)).toBe(false);
    expect(isValidIncidentEvidenceSize(0)).toBe(false);
  });
});
