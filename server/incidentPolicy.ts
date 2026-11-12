export type IncidentOrganizationRole = "owner" | "admin" | "lead_reviewer" | "reviewer" | "domain_reviewer" | "evidence_reviewer" | "auditor" | "contributor" | "member";
const INCIDENT_MANAGER_ROLES: readonly IncidentOrganizationRole[] = ["owner", "admin", "lead_reviewer"];
const INCIDENT_EVIDENCE_MIME_TYPES = new Set([
  "application/pdf", "image/jpeg", "image/png", "image/gif", "image/webp", "text/plain",
  "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);
export const MAX_INCIDENT_EVIDENCE_BYTES = 10 * 1024 * 1024;
export function canManageIncidents(role: IncidentOrganizationRole | null | undefined) {
  return role !== null && role !== undefined && INCIDENT_MANAGER_ROLES.includes(role);
}
export function canReadIncident(userId: number, reporterId: number, isManager: boolean) {
  return isManager || userId === reporterId;
}

export function isIncidentEvidenceStorageKey(input: { organizationId: number; incidentId: number; storageKey: string }) {
  const prefix = `incident-evidence/${input.organizationId}/${input.incidentId}/`;
  if (!input.storageKey.startsWith(prefix)) return false;
  const objectName = input.storageKey.slice(prefix.length);
  return /^[A-Za-z0-9][A-Za-z0-9._-]{0,254}$/.test(objectName);
}

export function isAllowedIncidentEvidenceMimeType(mimeType: string) {
  return INCIDENT_EVIDENCE_MIME_TYPES.has(mimeType.trim().toLowerCase());
}

export function isValidIncidentEvidenceSize(size: number) {
  return Number.isInteger(size) && size > 0 && size <= MAX_INCIDENT_EVIDENCE_BYTES;
}
