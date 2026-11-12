import { BANGLADESH_CONTROLS } from "./bangladeshCatalog";
import { normalizeBangladeshSector } from "./bangladeshSectors";

export function getBangladeshControlsForSector(value: string | null | undefined) {
  const sector = normalizeBangladeshSector(value);
  const crossSectorControls = BANGLADESH_CONTROLS.filter(control => control.sectorApplicability.includes("all"));
  const sectorControls = sector
    ? BANGLADESH_CONTROLS.filter(control => !control.sectorApplicability.includes("all") && control.sectorApplicability.includes(sector))
    : [];
  const controls = [...crossSectorControls, ...sectorControls];

  return {
    sector,
    controls,
    crossSectorCount: crossSectorControls.length,
    sectorSpecificCount: sectorControls.length,
    unmapped: Boolean(sector) && sectorControls.length === 0,
  } as const;
}
