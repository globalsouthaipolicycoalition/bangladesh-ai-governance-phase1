import { and, desc, eq, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { randomUUID } from "crypto";
import { incidentEvidence, incidentEvents, incidentReports, organizationMembers, organizations, users } from "../drizzle/schema";
import { isValidEvidenceContent } from "./agarasDb";
import { getDb } from "./db";
import { canManageIncidents, canReadIncident, isAllowedIncidentEvidenceMimeType, isIncidentEvidenceStorageKey, isValidIncidentEvidenceSize } from "./incidentPolicy";
import { storageGetSignedUrl, storagePut } from "./storage";

type Role = (typeof organizationMembers.$inferSelect)["role"];

async function membership(organizationId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Incident service is unavailable" });
  const [org] = await db.select({ ownerId: organizations.ownerId }).from(organizations).where(eq(organizations.id, organizationId)).limit(1);
  if (!org) throw new TRPCError({ code: "NOT_FOUND", message: "Organization not found" });
  const [member] = await db.select({ role: organizationMembers.role, status: organizationMembers.status }).from(organizationMembers)
    .where(and(eq(organizationMembers.organizationId, organizationId), eq(organizationMembers.userId, userId))).limit(1);
  if (org.ownerId === userId) return { role: "owner" as Role, manager: canManageIncidents("owner") };
  if (!member || member.status !== "active") throw new TRPCError({ code: "NOT_FOUND", message: "Organization not found" });
  return { role: member.role, manager: canManageIncidents(member.role) };
}

async function visibleIncident(incidentId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Incident service is unavailable" });
  const [incident] = await db.select().from(incidentReports).where(eq(incidentReports.id, incidentId)).limit(1);
  if (!incident) throw new TRPCError({ code: "NOT_FOUND", message: "Incident not found" });
  const access = await membership(incident.organizationId, userId);
  if (!canReadIncident(userId, incident.reportedBy, access.manager)) throw new TRPCError({ code: "NOT_FOUND", message: "Incident not found" });
  return { db, incident, access };
}

export async function listIncidents(organizationId: number, userId: number) {
  const { manager } = await membership(organizationId, userId);
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Incident service is unavailable" });
  const conditions = manager
    ? eq(incidentReports.organizationId, organizationId)
    : and(eq(incidentReports.organizationId, organizationId), eq(incidentReports.reportedBy, userId));
  return db.select().from(incidentReports).where(conditions).orderBy(desc(incidentReports.updatedAt));
}

export async function createIncident(input: {
  organizationId: number; userId: number; title: string; description: string; category: "safety" | "privacy" | "security" | "bias" | "accuracy" | "availability" | "misuse" | "other";
  severity: "low" | "moderate" | "high" | "critical"; occurredAt?: Date; detectedAt?: Date; affectedSystem?: string; impactSummary?: string; evidenceNotes?: string;
}) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Incident service is unavailable" });
  return db.transaction(async tx => {
    const [organization] = await tx.select({ ownerId: organizations.ownerId }).from(organizations).where(eq(organizations.id, input.organizationId)).limit(1).for("update");
    if (!organization) throw new TRPCError({ code: "NOT_FOUND", message: "Organization not found" });
    const [member] = await tx.select({ status: organizationMembers.status }).from(organizationMembers)
      .where(and(eq(organizationMembers.organizationId, input.organizationId), eq(organizationMembers.userId, input.userId))).limit(1).for("update");
    if (organization.ownerId !== input.userId && member?.status !== "active") throw new TRPCError({ code: "NOT_FOUND", message: "Organization not found" });
    const [insert] = await tx.insert(incidentReports).values({
      organizationId: input.organizationId, reportedBy: input.userId, title: input.title, description: input.description,
      category: input.category, severity: input.severity, occurredAt: input.occurredAt, detectedAt: input.detectedAt,
      affectedSystem: input.affectedSystem, impactSummary: input.impactSummary, evidenceNotes: input.evidenceNotes,
      status: "submitted",
    });
    const incidentId = Number(insert.insertId);
    await tx.insert(incidentEvents).values({ incidentId, organizationId: input.organizationId, actorId: input.userId, eventType: "created", details: "Incident report submitted" });
    const [row] = await tx.select().from(incidentReports).where(eq(incidentReports.id, incidentId)).limit(1);
    return row;
  });
}

export async function getIncident(incidentId: number, userId: number) {
  const { db, incident, access } = await visibleIncident(incidentId, userId);
  const [events, evidence] = await Promise.all([
    db.select().from(incidentEvents).where(and(eq(incidentEvents.incidentId, incidentId), eq(incidentEvents.organizationId, incident.organizationId))).orderBy(desc(incidentEvents.createdAt)),
    db.select({ id: incidentEvidence.id, fileName: incidentEvidence.fileName, mimeType: incidentEvidence.mimeType, fileSize: incidentEvidence.fileSize, uploadedBy: incidentEvidence.uploadedBy, createdAt: incidentEvidence.createdAt })
      .from(incidentEvidence).where(and(eq(incidentEvidence.incidentId, incidentId), eq(incidentEvidence.organizationId, incident.organizationId))).orderBy(desc(incidentEvidence.createdAt)),
  ]);
  return { incident, events, evidence, canManage: access.manager };
}

function safeIncidentEvidenceName(fileName: string) {
  const baseName = fileName.split(/[\\/]/).pop()?.replace(/[^A-Za-z0-9._-]/g, "_").replace(/^\.+/, "").slice(0, 180);
  return baseName || "evidence.bin";
}

export async function uploadIncidentEvidence(input: { incidentId: number; userId: number; fileName: string; mimeType: string; base64: string }) {
  const { incident } = await visibleIncident(input.incidentId, input.userId);
  if (["closed", "dismissed"].includes(incident.status)) throw new TRPCError({ code: "BAD_REQUEST", message: "Evidence cannot be added after an incident is closed or dismissed" });
  if (!input.fileName.trim() || input.fileName.length > 255 || /[\u0000-\u001f\u007f]/.test(input.fileName)) throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid evidence file name" });
  const mimeType = input.mimeType.trim().toLowerCase();
  if (!isAllowedIncidentEvidenceMimeType(mimeType)) throw new TRPCError({ code: "BAD_REQUEST", message: "Unsupported evidence file type" });
  const dataUrl = input.base64.match(/^data:([^;,]+);base64,/i);
  if (dataUrl && dataUrl[1]!.toLowerCase() !== mimeType) throw new TRPCError({ code: "BAD_REQUEST", message: "Evidence MIME type does not match the uploaded file data" });
  const raw = input.base64.replace(/^data:[^;]+;base64,/i, "");
  if (raw.length > 14_000_000 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(raw)) throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid or oversized evidence file data" });
  const bytes = Buffer.from(raw, "base64");
  if (!isValidIncidentEvidenceSize(bytes.length)) throw new TRPCError({ code: "BAD_REQUEST", message: "Evidence files must be between 1 byte and 10 MiB" });
  if (!isValidEvidenceContent(mimeType, bytes)) throw new TRPCError({ code: "BAD_REQUEST", message: "Uploaded content does not match an accepted file type" });

  const objectName = `${randomUUID()}-${safeIncidentEvidenceName(input.fileName)}`;
  const stored = await storagePut(`incident-evidence/${incident.organizationId}/${incident.id}/${objectName}`, bytes, mimeType);
  if (!isIncidentEvidenceStorageKey({ organizationId: incident.organizationId, incidentId: incident.id, storageKey: stored.key })) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Evidence storage returned an invalid key" });

  // Re-check current access/state after the storage transfer before persisting its reference.
  const current = await visibleIncident(input.incidentId, input.userId);
  if (["closed", "dismissed"].includes(current.incident.status)) throw new TRPCError({ code: "BAD_REQUEST", message: "Evidence cannot be added after an incident is closed or dismissed" });
  const db = current.db;
  return db.transaction(async tx => {
    const [lockedIncident] = await tx.select({ id: incidentReports.id, organizationId: incidentReports.organizationId, reportedBy: incidentReports.reportedBy, status: incidentReports.status })
      .from(incidentReports).where(eq(incidentReports.id, current.incident.id)).limit(1).for("update");
    if (!lockedIncident || lockedIncident.organizationId !== current.incident.organizationId) throw new TRPCError({ code: "NOT_FOUND", message: "Incident not found" });
    const [organization] = await tx.select({ ownerId: organizations.ownerId }).from(organizations).where(eq(organizations.id, lockedIncident.organizationId)).limit(1).for("update");
    const [member] = await tx.select({ role: organizationMembers.role, status: organizationMembers.status }).from(organizationMembers)
      .where(and(eq(organizationMembers.organizationId, lockedIncident.organizationId), eq(organizationMembers.userId, input.userId))).limit(1).for("update");
    const isManager = organization?.ownerId === input.userId || (member?.status === "active" && canManageIncidents(member.role));
    if (!canReadIncident(input.userId, lockedIncident.reportedBy, isManager)) throw new TRPCError({ code: "NOT_FOUND", message: "Incident not found" });
    if (["closed", "dismissed"].includes(lockedIncident.status)) throw new TRPCError({ code: "BAD_REQUEST", message: "Evidence cannot be added after an incident is closed or dismissed" });
    const [row] = await tx.insert(incidentEvidence).values({
      incidentId: lockedIncident.id, organizationId: lockedIncident.organizationId, uploadedBy: input.userId,
      fileName: input.fileName.trim(), storageKey: stored.key, mimeType, fileSize: bytes.length,
    });
    await tx.insert(incidentEvents).values({ incidentId: lockedIncident.id, organizationId: lockedIncident.organizationId, actorId: input.userId, eventType: "evidence_added", details: `Evidence file uploaded: ${input.fileName.trim()} (${bytes.length} bytes)` });
    const [metadata] = await tx.select({ id: incidentEvidence.id, fileName: incidentEvidence.fileName, mimeType: incidentEvidence.mimeType, fileSize: incidentEvidence.fileSize, uploadedBy: incidentEvidence.uploadedBy, createdAt: incidentEvidence.createdAt })
      .from(incidentEvidence).where(eq(incidentEvidence.id, Number(row.insertId))).limit(1);
    return metadata;
  });
}

export async function getIncidentEvidenceDownload(evidenceId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Incident service is unavailable" });
  const [file] = await db.select().from(incidentEvidence).where(eq(incidentEvidence.id, evidenceId)).limit(1);
  if (!file) throw new TRPCError({ code: "NOT_FOUND", message: "Evidence file not found" });
  const { incident } = await visibleIncident(file.incidentId, userId);
  if (file.organizationId !== incident.organizationId || !isIncidentEvidenceStorageKey({ organizationId: file.organizationId, incidentId: file.incidentId, storageKey: file.storageKey })) throw new TRPCError({ code: "NOT_FOUND", message: "Evidence file not found" });
  const url = await storageGetSignedUrl(file.storageKey);
  const verified = await visibleIncident(file.incidentId, userId);
  if (verified.incident.organizationId !== file.organizationId) throw new TRPCError({ code: "NOT_FOUND", message: "Evidence file not found" });
  await verified.db.insert(incidentEvents).values({ incidentId: file.incidentId, organizationId: file.organizationId, actorId: userId, eventType: "evidence_link_issued", details: `Evidence download link issued for: ${file.fileName}` });
  return { url, fileName: file.fileName };
}

export async function addIncidentActivity(input: { incidentId: number; userId: number; message: string; evidence?: boolean }) {
  const { db, incident } = await visibleIncident(input.incidentId, input.userId);
  await db.transaction(async tx => {
    const [lockedIncident] = await tx.select().from(incidentReports).where(eq(incidentReports.id, incident.id)).limit(1).for("update");
    if (!lockedIncident || lockedIncident.organizationId !== incident.organizationId) throw new TRPCError({ code: "NOT_FOUND", message: "Incident not found" });
    const [organization] = await tx.select({ ownerId: organizations.ownerId }).from(organizations).where(eq(organizations.id, lockedIncident.organizationId)).limit(1).for("update");
    if (!organization) throw new TRPCError({ code: "NOT_FOUND", message: "Incident not found" });
    const [member] = await tx.select({ role: organizationMembers.role, status: organizationMembers.status }).from(organizationMembers)
      .where(and(eq(organizationMembers.organizationId, lockedIncident.organizationId), eq(organizationMembers.userId, input.userId))).limit(1).for("update");
    const isManager = organization.ownerId === input.userId || (member?.status === "active" && canManageIncidents(member.role));
    if (!canReadIncident(input.userId, lockedIncident.reportedBy, isManager)) throw new TRPCError({ code: "NOT_FOUND", message: "Incident not found" });
    if (input.evidence) {
      const evidenceNotes = lockedIncident.evidenceNotes ? `${lockedIncident.evidenceNotes}\n\n${input.message}` : input.message;
      if (evidenceNotes.length > 20000) throw new TRPCError({ code: "BAD_REQUEST", message: "Combined evidence notes exceed the 20,000 character limit" });
      await tx.update(incidentReports).set({ evidenceNotes }).where(eq(incidentReports.id, lockedIncident.id));
    }
    await tx.insert(incidentEvents).values({ incidentId: lockedIncident.id, organizationId: lockedIncident.organizationId, actorId: input.userId, eventType: input.evidence ? "evidence_added" : "comment", details: input.message });
  });
  return { success: true };
}

export async function updateIncident(input: {
  incidentId: number; userId: number; status?: "submitted" | "triage" | "investigating" | "response" | "monitoring" | "closed" | "dismissed";
  severity?: "low" | "moderate" | "high" | "critical"; assignedTo?: number | null; containment?: string; rootCause?: string; responseSummary?: string; remediationPlan?: string; closureSummary?: string;
}) {
  const { db, incident, access } = await visibleIncident(input.incidentId, input.userId);
  if (!access.manager) throw new TRPCError({ code: "FORBIDDEN", message: "Only an organization owner, admin, or lead reviewer can manage incident triage and response" });
  if ((input.status === "closed" || input.status === "dismissed") && !input.closureSummary?.trim()) throw new TRPCError({ code: "BAD_REQUEST", message: "Provide a closure rationale before closing or dismissing an incident" });
  const patch = {
    ...(input.status === undefined ? {} : { status: input.status, closedAt: input.status === "closed" || input.status === "dismissed" ? new Date() : null }),
    ...(input.severity === undefined ? {} : { severity: input.severity }),
    ...(input.assignedTo === undefined ? {} : { assignedTo: input.assignedTo }),
    ...(input.containment === undefined ? {} : { containment: input.containment }),
    ...(input.rootCause === undefined ? {} : { rootCause: input.rootCause }),
    ...(input.responseSummary === undefined ? {} : { responseSummary: input.responseSummary }),
    ...(input.remediationPlan === undefined ? {} : { remediationPlan: input.remediationPlan }),
    ...(input.closureSummary === undefined ? {} : { closureSummary: input.closureSummary }),
  };
  return db.transaction(async tx => {
    const [lockedIncident] = await tx.select().from(incidentReports).where(eq(incidentReports.id, incident.id)).limit(1).for("update");
    if (!lockedIncident || lockedIncident.organizationId !== incident.organizationId) throw new TRPCError({ code: "NOT_FOUND", message: "Incident not found" });
    const [organization] = await tx.select({ ownerId: organizations.ownerId }).from(organizations).where(eq(organizations.id, lockedIncident.organizationId)).limit(1).for("update");
    if (!organization) throw new TRPCError({ code: "NOT_FOUND", message: "Incident not found" });
    const [member] = await tx.select({ role: organizationMembers.role, status: organizationMembers.status }).from(organizationMembers)
      .where(and(eq(organizationMembers.organizationId, lockedIncident.organizationId), eq(organizationMembers.userId, input.userId))).limit(1).for("update");
    const isManager = organization.ownerId === input.userId || (member?.status === "active" && canManageIncidents(member.role));
    if (!isManager) throw new TRPCError({ code: "FORBIDDEN", message: "Only an organization owner, admin, or lead reviewer can manage incident triage and response" });
    if (input.assignedTo != null) {
      const [assignee] = await tx.select({ userId: organizationMembers.userId }).from(organizationMembers).where(and(
        eq(organizationMembers.organizationId, lockedIncident.organizationId), eq(organizationMembers.userId, input.assignedTo), eq(organizationMembers.status, "active"),
      )).limit(1).for("update");
      if (!assignee && organization.ownerId !== input.assignedTo) throw new TRPCError({ code: "BAD_REQUEST", message: "The assignee must be an active member of this organization" });
    }
    await tx.update(incidentReports).set(patch).where(eq(incidentReports.id, lockedIncident.id));
    const eventType = input.status === "closed" || input.status === "dismissed" ? "closed" : input.status === "triage" ? "triaged" : input.status ? "status_changed" : "updated";
    const details = [input.status && `Status: ${input.status}`, input.severity && `Severity: ${input.severity}`, input.assignedTo !== undefined && `Assigned user: ${input.assignedTo ?? "unassigned"}`, input.containment && "Containment updated", input.rootCause && "Investigation updated", input.responseSummary && "Response updated", input.remediationPlan && "Remediation plan updated", input.closureSummary && "Closure summary updated"].filter(Boolean).join("; ");
    await tx.insert(incidentEvents).values({ incidentId: lockedIncident.id, organizationId: lockedIncident.organizationId, actorId: input.userId, eventType, details: details || "Incident record updated" });
    const [updated] = await tx.select().from(incidentReports).where(eq(incidentReports.id, lockedIncident.id)).limit(1);
    return updated;
  });
}

export async function incidentOrganizationOptions(userId: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Incident service is unavailable" });
  const memberships = await db.select({ organizationId: organizationMembers.organizationId }).from(organizationMembers)
    .where(and(eq(organizationMembers.userId, userId), eq(organizationMembers.status, "active")));
  const owned = await db.select({ organizationId: organizations.id }).from(organizations).where(eq(organizations.ownerId, userId));
  const ids = [...new Set([...memberships.map(row => row.organizationId), ...owned.map(row => row.organizationId)])];
  if (!ids.length) return [];
  return db.select({ id: organizations.id, name: organizations.name }).from(organizations).where(inArray(organizations.id, ids)).orderBy(organizations.name);
}


export async function incidentMembers(organizationId: number, userId: number) {
  const access = await membership(organizationId, userId);
  if (!access.manager) throw new TRPCError({ code: "FORBIDDEN", message: "Only incident managers may view assignment options" });
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Incident service is unavailable" });
  const rows = await db.select({ id: users.id, name: users.name, email: users.email }).from(organizationMembers)
    .innerJoin(users, eq(organizationMembers.userId, users.id))
    .where(and(eq(organizationMembers.organizationId, organizationId), eq(organizationMembers.status, "active")));
  const [org] = await db.select({ ownerId: organizations.ownerId }).from(organizations).where(eq(organizations.id, organizationId)).limit(1);
  if (org && !rows.some(row => row.id === org.ownerId)) {
    const [owner] = await db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(eq(users.id, org.ownerId)).limit(1);
    if (owner) rows.unshift(owner);
  }
  return rows;
}
