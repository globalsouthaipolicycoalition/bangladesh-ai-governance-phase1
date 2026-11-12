import { describe, expect, it } from "vitest";
import { BANGLADESH_CONTROLS } from "./bangladeshCatalog";
import { getBangladeshControlsForSector } from "./bangladeshSectorMapping";
import { getBangladeshSectorLabel, normalizeBangladeshSector } from "./bangladeshSectors";

describe("Bangladesh sector mapping", () => {
  it("normalizes IDs and established labels without guessing mixed legacy free text", () => {
    expect(normalizeBangladeshSector("banking")).toBe("banking");
    expect(normalizeBangladeshSector("Technology")).toBe("technology");
    expect(normalizeBangladeshSector("উচ্চশিক্ষা")).toBe("higher_education");
    expect(normalizeBangladeshSector("Education & research")).toBeUndefined();
    expect(getBangladeshSectorLabel("energy_utilities", true)).toBe("জ্বালানি ও ইউটিলিটি");
  });

  it("returns only cross-sector plus the controls explicitly tagged for the chosen sector", () => {
    const banking = getBangladeshControlsForSector("banking");
    expect(banking.sectorSpecificCount).toBe(2);
    expect(banking.controls.map(control => control.code)).toEqual(expect.arrayContaining(["BD-BANK-001", "BD-BANK-002"]));
    expect(banking.controls.every(control => control.sectorApplicability.includes("all") || control.sectorApplicability.includes("banking"))).toBe(true);
  });

  it("does not invent local coverage for sectors with no Bangladesh-specific mapping", () => {
    const agriculture = getBangladeshControlsForSector("agriculture");
    expect(agriculture.unmapped).toBe(true);
    expect(agriculture.sectorSpecificCount).toBe(0);
    expect(agriculture.controls.length).toBe(agriculture.crossSectorCount);
    expect(agriculture.controls.every(control => control.sectorApplicability.includes("all"))).toBe(true);
  });

  it("shows the cross-sector baseline, but no sector overlay, for an unrecognized legacy value", () => {
    const legacy = getBangladeshControlsForSector("Education & research");
    expect(legacy.sector).toBeUndefined();
    expect(legacy.unmapped).toBe(false);
    expect(legacy.controls.every(control => control.sectorApplicability.includes("all"))).toBe(true);
  });

  it("keeps every static Bangladesh control provisional and outside scoring integration", () => {
    expect(BANGLADESH_CONTROLS).toHaveLength(16);
    expect(BANGLADESH_CONTROLS.every(control => control.lifecycle === "in_review")).toBe(true);
  });
});
