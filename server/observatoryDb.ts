import { and, desc, eq, inArray, gte, lte, sql } from "drizzle-orm";
import { adminDataAudit, observatoryIndicators, observatoryObservations, observatorySources } from "../drizzle/schema";
import { getDb } from "./db";
import type { ObservatoryCsvRow } from "../shared/observatoryCsv";

export type PublicObservatoryQuery = {
  domain?: string;
  sourceId?: number;
  from?: Date;
  to?: Date;
  page?: number;
  pageSize?: number;
};

type PublicIndicatorRow = Pick<typeof observatoryIndicators.$inferSelect, "id" | "code" | "title" | "domain" | "sector" | "geographicCoverage" | "definition" | "unit" | "dataType" | "baselineValue" | "currentValue" | "targetValue" | "methodologyVersion">;
type PublicObservationRow = Pick<typeof observatoryObservations.$inferSelect, "id" | "observationDate" | "value" | "valueLabel" | "periodLabel" | "methodologyVersion" | "observationKind" | "verificationStatus" | "confidence" | "notes" | "publishedAt">;
type PublicSourceRow = Pick<typeof observatorySources.$inferSelect, "id" | "name" | "publisher" | "url">;
type PublicObservationRecord = { observation: PublicObservationRow; indicator: PublicIndicatorRow; source: PublicSourceRow };

export function projectPublicObservatoryData(input: { indicators: PublicIndicatorRow[]; observations: PublicObservationRecord[]; page: number; pageSize: number; total: number }) {
  return {
    indicators: input.indicators.map(({ id, code, title, domain, sector, geographicCoverage, definition, unit, dataType, baselineValue, currentValue, targetValue, methodologyVersion }) => ({ id, code, title, domain, sector, geographicCoverage, definition, unit, dataType, baselineValue, currentValue, targetValue, methodologyVersion })),
    observations: input.observations.map(({ observation, indicator, source }) => ({
      observation: { id: observation.id, observationDate: observation.observationDate, value: observation.value, valueLabel: observation.valueLabel, periodLabel: observation.periodLabel, methodologyVersion: observation.methodologyVersion, observationKind: observation.observationKind, verificationStatus: observation.verificationStatus, confidence: observation.confidence, notes: observation.notes, publishedAt: observation.publishedAt },
      indicator: { id: indicator.id, code: indicator.code, title: indicator.title, domain: indicator.domain, sector: indicator.sector, geographicCoverage: indicator.geographicCoverage, definition: indicator.definition, unit: indicator.unit, dataType: indicator.dataType, baselineValue: indicator.baselineValue, currentValue: indicator.currentValue, targetValue: indicator.targetValue, methodologyVersion: indicator.methodologyVersion },
      source: { id: source.id, name: source.name, publisher: source.publisher, url: source.url },
    })),
    page: input.page,
    pageSize: input.pageSize,
    total: input.total,
  };
}

export async function getPublicObservatory(query: PublicObservatoryQuery = {}) {
  const db = await getDb();
  if (!db) throw new Error("Observatory data service is unavailable");
  const page = Math.max(1, Math.floor(query.page ?? 1));
  const pageSize = Math.min(100, Math.max(1, Math.floor(query.pageSize ?? 50)));
  const observationFilters = [eq(observatoryObservations.status, "published" as const), eq(observatoryIndicators.active, true), eq(observatorySources.active, true)];
  if (query.domain) observationFilters.push(eq(observatoryIndicators.domain, query.domain));
  if (query.sourceId) observationFilters.push(eq(observatoryObservations.sourceId, query.sourceId));
  if (query.from) observationFilters.push(gte(observatoryObservations.observationDate, query.from));
  if (query.to) observationFilters.push(lte(observatoryObservations.observationDate, query.to));
  const [indicators, observations] = await Promise.all([
    db.select({
      id: observatoryIndicators.id, code: observatoryIndicators.code, title: observatoryIndicators.title,
      domain: observatoryIndicators.domain, sector: observatoryIndicators.sector,
      geographicCoverage: observatoryIndicators.geographicCoverage, definition: observatoryIndicators.definition,
      unit: observatoryIndicators.unit, dataType: observatoryIndicators.dataType,
      baselineValue: observatoryIndicators.baselineValue, currentValue: observatoryIndicators.currentValue,
      targetValue: observatoryIndicators.targetValue, methodologyVersion: observatoryIndicators.methodologyVersion,
    }).from(observatoryIndicators).where(and(eq(observatoryIndicators.active, true), query.domain ? eq(observatoryIndicators.domain, query.domain) : undefined)).orderBy(observatoryIndicators.code),
    db.select({
      observation: {
        id: observatoryObservations.id, observationDate: observatoryObservations.observationDate,
        value: observatoryObservations.value, valueLabel: observatoryObservations.valueLabel,
        periodLabel: observatoryObservations.periodLabel, methodologyVersion: observatoryObservations.methodologyVersion,
        observationKind: observatoryObservations.observationKind, verificationStatus: observatoryObservations.verificationStatus,
        confidence: observatoryObservations.confidence, notes: observatoryObservations.notes,
        publishedAt: observatoryObservations.publishedAt,
      },
      indicator: {
        id: observatoryIndicators.id, code: observatoryIndicators.code, title: observatoryIndicators.title,
        domain: observatoryIndicators.domain, sector: observatoryIndicators.sector,
        geographicCoverage: observatoryIndicators.geographicCoverage, definition: observatoryIndicators.definition,
        unit: observatoryIndicators.unit, dataType: observatoryIndicators.dataType,
        baselineValue: observatoryIndicators.baselineValue, currentValue: observatoryIndicators.currentValue,
        targetValue: observatoryIndicators.targetValue, methodologyVersion: observatoryIndicators.methodologyVersion,
      },
      source: { id: observatorySources.id, name: observatorySources.name, publisher: observatorySources.publisher, url: observatorySources.url },
    })
      .from(observatoryObservations)
      .innerJoin(observatoryIndicators, eq(observatoryObservations.indicatorId, observatoryIndicators.id))
      .innerJoin(observatorySources, eq(observatoryObservations.sourceId, observatorySources.id))
      .where(and(...observationFilters))
      .orderBy(desc(observatoryObservations.observationDate), desc(observatoryObservations.createdAt))
      .limit(pageSize).offset((page - 1) * pageSize),
  ]);
  const [{ count }] = await db.select({ count: sql<number>`count(*)` })
    .from(observatoryObservations)
    .innerJoin(observatoryIndicators, eq(observatoryObservations.indicatorId, observatoryIndicators.id))
    .innerJoin(observatorySources, eq(observatoryObservations.sourceId, observatorySources.id))
    .where(and(...observationFilters));
  return projectPublicObservatoryData({ indicators, observations, page, pageSize, total: Number(count) });
}

export async function getObservatoryAdminData() {
  const db = await getDb();
  if (!db) throw new Error("Observatory curation service is unavailable");
  const [sources, indicators, observations, audit] = await Promise.all([
    db.select().from(observatorySources).orderBy(desc(observatorySources.createdAt)),
    db.select().from(observatoryIndicators).orderBy(observatoryIndicators.code),
    db.select({ observation: observatoryObservations, indicator: observatoryIndicators, source: observatorySources })
      .from(observatoryObservations)
      .innerJoin(observatoryIndicators, eq(observatoryObservations.indicatorId, observatoryIndicators.id))
      .innerJoin(observatorySources, eq(observatoryObservations.sourceId, observatorySources.id))
      .orderBy(desc(observatoryObservations.createdAt)),
    db.select().from(adminDataAudit).where(eq(adminDataAudit.entityType, "observatory"))
      .orderBy(desc(adminDataAudit.createdAt)).limit(100),
  ]);
  return { sources, indicators, observations, audit };
}

function auditJson(value: unknown) {
  return JSON.stringify(value, (_key, item) => item instanceof Date ? item.toISOString() : item) ?? "null";
}

function requireAdminReason(reason: string) {
  const clean = reason.trim();
  if (clean.length < 5 || clean.length > 1000) throw new Error("Provide an edit reason between 5 and 1,000 characters");
  return clean;
}

export async function createObservatorySource(input: { name: string; publisher: string; url: string; description?: string; freshnessWindowDays?: number; qualityThreshold?: string; userId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.transaction(async tx => {
    const [result] = await tx.insert(observatorySources).values({ name: input.name.trim(), publisher: input.publisher.trim(), url: input.url.trim(), description: input.description?.trim() || null, createdBy: input.userId });
    const [row] = await tx.select().from(observatorySources).where(eq(observatorySources.id, Number(result.insertId))).limit(1);
    if (!row) throw new Error("Source was not created");
    await tx.insert(adminDataAudit).values({ actorId: input.userId, entityType: "observatory", entityId: `source:${row.id}`, action: "created", reason: "Created through administrator curation", beforeData: null, afterData: auditJson(row) });
    return row;
  });
}

export async function updateObservatorySource(input: { sourceId: number; name: string; publisher: string; url: string; description?: string; freshnessWindowDays?: number; qualityThreshold?: string; active: boolean; reason: string; userId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const reason = requireAdminReason(input.reason);
  return db.transaction(async tx => {
    const [before] = await tx.select().from(observatorySources).where(eq(observatorySources.id, input.sourceId)).limit(1).for("update");
    if (!before) throw new Error("Source not found");
    const patch = { name: input.name.trim(), publisher: input.publisher.trim(), url: input.url.trim(), description: input.description?.trim() || null, freshnessWindowDays: input.freshnessWindowDays ?? null, qualityThreshold: input.qualityThreshold ?? null, active: input.active };
    const changed = before.name !== patch.name || before.publisher !== patch.publisher || before.url !== patch.url || before.description !== patch.description;
    await tx.update(observatorySources).set(patch).where(eq(observatorySources.id, input.sourceId));
    const [after] = await tx.select().from(observatorySources).where(eq(observatorySources.id, input.sourceId)).limit(1);
    await tx.insert(adminDataAudit).values({ actorId: input.userId, entityType: "observatory", entityId: `source:${input.sourceId}`, action: input.active ? "updated" : "archived", reason, beforeData: auditJson(before), afterData: auditJson(after) });
    if (changed || (before.active && !input.active)) {
      const published = await tx.select().from(observatoryObservations).where(and(eq(observatoryObservations.sourceId, input.sourceId), eq(observatoryObservations.status, "published")));
      for (const row of published) {
        await tx.update(observatoryObservations).set({ status: "draft", publishedBy: null, publishedAt: null }).where(eq(observatoryObservations.id, row.id));
        await tx.insert(adminDataAudit).values({ actorId: input.userId, entityType: "observatory", entityId: `observation:${row.id}`, action: "corrected", reason: `Source metadata changed; observation returned to draft. ${reason}`, beforeData: auditJson(row), afterData: auditJson({ ...row, status: "draft", publishedBy: null, publishedAt: null }) });
      }
    }
    return after;
  });
}

export async function createObservatoryIndicator(input: { code: string; title: string; domain: string; sector?: string; geographicCoverage?: string; definition: string; unit?: string; dataType?: "numeric" | "percentage" | "count" | "currency" | "text" | "binary"; baselineValue?: string; currentValue?: string; targetValue?: string; methodologyVersion: string; userId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.transaction(async tx => {
    const [result] = await tx.insert(observatoryIndicators).values({ code: input.code.trim().toUpperCase(), title: input.title.trim(), domain: input.domain.trim(), definition: input.definition.trim(), sector: input.sector?.trim() || null, geographicCoverage: input.geographicCoverage?.trim() || null, unit: input.unit?.trim() || null, dataType: input.dataType ?? "numeric", baselineValue: input.baselineValue ?? null, currentValue: input.currentValue ?? null, targetValue: input.targetValue ?? null, methodologyVersion: input.methodologyVersion.trim(), createdBy: input.userId });
    const [row] = await tx.select().from(observatoryIndicators).where(eq(observatoryIndicators.id, Number(result.insertId))).limit(1);
    if (!row) throw new Error("Indicator was not created");
    await tx.insert(adminDataAudit).values({ actorId: input.userId, entityType: "observatory", entityId: `indicator:${row.id}`, action: "created", reason: "Created through administrator curation", beforeData: null, afterData: auditJson(row) });
    return row;
  });
}

export async function updateObservatoryIndicator(input: { indicatorId: number; title: string; domain: string; sector?: string; geographicCoverage?: string; definition: string; unit?: string; dataType?: "numeric" | "percentage" | "count" | "currency" | "text" | "binary"; baselineValue?: string; currentValue?: string; targetValue?: string; methodologyVersion: string; active: boolean; reason: string; userId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const reason = requireAdminReason(input.reason);
  return db.transaction(async tx => {
    const [before] = await tx.select().from(observatoryIndicators).where(eq(observatoryIndicators.id, input.indicatorId)).limit(1).for("update");
    if (!before) throw new Error("Indicator not found");
    const patch = { title: input.title.trim(), domain: input.domain.trim(), sector: input.sector?.trim() || null, geographicCoverage: input.geographicCoverage?.trim() || null, definition: input.definition.trim(), unit: input.unit?.trim() || null, dataType: input.dataType ?? "numeric" as const, baselineValue: input.baselineValue ?? null, currentValue: input.currentValue ?? null, targetValue: input.targetValue ?? null, methodologyVersion: input.methodologyVersion.trim(), active: input.active };
    const changed = before.title !== patch.title || before.domain !== patch.domain || before.sector !== patch.sector || before.geographicCoverage !== patch.geographicCoverage || before.definition !== patch.definition || before.unit !== patch.unit || before.dataType !== patch.dataType || before.baselineValue !== patch.baselineValue || before.currentValue !== patch.currentValue || before.targetValue !== patch.targetValue || before.methodologyVersion !== patch.methodologyVersion;
    await tx.update(observatoryIndicators).set(patch).where(eq(observatoryIndicators.id, input.indicatorId));
    const [after] = await tx.select().from(observatoryIndicators).where(eq(observatoryIndicators.id, input.indicatorId)).limit(1);
    await tx.insert(adminDataAudit).values({ actorId: input.userId, entityType: "observatory", entityId: `indicator:${input.indicatorId}`, action: input.active ? "updated" : "archived", reason, beforeData: auditJson(before), afterData: auditJson(after) });
    if (changed || (before.active && !input.active)) {
      const published = await tx.select().from(observatoryObservations).where(and(eq(observatoryObservations.indicatorId, input.indicatorId), eq(observatoryObservations.status, "published")));
      for (const row of published) {
        await tx.update(observatoryObservations).set({ status: "draft", publishedBy: null, publishedAt: null }).where(eq(observatoryObservations.id, row.id));
        await tx.insert(adminDataAudit).values({ actorId: input.userId, entityType: "observatory", entityId: `observation:${row.id}`, action: "corrected", reason: `Indicator definition/method changed; observation returned to draft. ${reason}`, beforeData: auditJson(row), afterData: auditJson({ ...row, status: "draft", publishedBy: null, publishedAt: null }) });
      }
    }
    return after;
  });
}

export async function createObservatoryObservation(input: { indicatorId: number; sourceId: number; value?: string; valueLabel?: string; observationDate: Date; periodLabel?: string; notes?: string; methodologyVersion: string; observationKind?: "reported" | "estimate" | "projection"; collectionMethod?: string; sourceTimestamp?: Date; confidence?: string; verificationStatus?: "unverified" | "reviewed" | "independently_verified"; verificationNotes?: string; publish: boolean; userId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const numericValue = input.value !== undefined;
  const textValue = Boolean(input.valueLabel?.trim());
  if (numericValue === textValue) throw new Error("Provide exactly one numeric value or a text label");
  if (numericValue && (!Number.isFinite(Number(input.value)) || Math.abs(Number(input.value)) > 999999999999.999999)) throw new Error("Numeric value exceeds the supported decimal precision");
  return db.transaction(async tx => {
    const [indicator] = await tx.select().from(observatoryIndicators).where(and(eq(observatoryIndicators.id, input.indicatorId), eq(observatoryIndicators.active, true))).limit(1);
    const [source] = await tx.select().from(observatorySources).where(and(eq(observatorySources.id, input.sourceId), eq(observatorySources.active, true))).limit(1);
    if (!indicator || !source) throw new Error("Select an active indicator and source");
    const duplicate = await tx.select({ id: observatoryObservations.id }).from(observatoryObservations).where(and(eq(observatoryObservations.indicatorId, input.indicatorId), eq(observatoryObservations.sourceId, input.sourceId), sql`${observatoryObservations.observationDate} = ${input.observationDate}`, input.periodLabel ? eq(observatoryObservations.periodLabel, input.periodLabel.trim()) : sql`${observatoryObservations.periodLabel} IS NULL`)).limit(1);
    if (duplicate.length) throw new Error("A duplicate observation already exists for this indicator, source, date, and period");
    const status = input.publish ? "published" as const : "draft" as const;
    const verificationTimestamp = input.verificationStatus && input.verificationStatus !== "unverified" ? new Date() : undefined;
    const [result] = await tx.insert(observatoryObservations).values({ indicatorId: input.indicatorId, sourceId: input.sourceId, value: input.value, valueLabel: input.valueLabel?.trim() || undefined, observationDate: input.observationDate, periodLabel: input.periodLabel?.trim() || undefined, notes: input.notes?.trim() || undefined, methodologyVersion: input.methodologyVersion.trim(), observationKind: input.observationKind ?? "reported", collectionMethod: input.collectionMethod?.trim() || undefined, sourceTimestamp: input.sourceTimestamp, confidence: input.confidence, verificationStatus: input.verificationStatus ?? "unverified", verificationNotes: input.verificationNotes?.trim() || undefined, verifiedBy: verificationTimestamp ? input.userId : undefined, verifiedAt: verificationTimestamp, status, createdBy: input.userId, publishedBy: input.publish ? input.userId : undefined, publishedAt: input.publish ? new Date() : undefined });
    const [row] = await tx.select().from(observatoryObservations).where(eq(observatoryObservations.id, Number(result.insertId))).limit(1);
    if (!row) throw new Error("Observation was not created");
    await tx.insert(adminDataAudit).values({ actorId: input.userId, entityType: "observatory", entityId: `observation:${row.id}`, action: input.publish ? "published" : "created", reason: "Created through administrator curation", beforeData: null, afterData: auditJson(row) });
    return row;
  });
}

export async function updateObservatoryObservation(input: { observationId: number; indicatorId: number; sourceId: number; value?: string; valueLabel?: string; observationDate: Date; periodLabel?: string; notes?: string; methodologyVersion: string; observationKind?: "reported" | "estimate" | "projection"; collectionMethod?: string; sourceTimestamp?: Date; confidence?: string; verificationStatus?: "unverified" | "reviewed" | "independently_verified"; verificationNotes?: string; reason: string; userId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const reason = requireAdminReason(input.reason);
  const numericValue = input.value !== undefined;
  const textValue = Boolean(input.valueLabel?.trim());
  if (numericValue === textValue) throw new Error("Provide exactly one numeric value or a text label");
  if (numericValue && (!Number.isFinite(Number(input.value)) || Math.abs(Number(input.value)) > 999999999999.999999)) throw new Error("Numeric value exceeds the supported decimal precision");
  return db.transaction(async tx => {
    const [before] = await tx.select().from(observatoryObservations).where(eq(observatoryObservations.id, input.observationId)).limit(1).for("update");
    if (!before) throw new Error("Observation not found");
    const [indicator] = await tx.select().from(observatoryIndicators).where(and(eq(observatoryIndicators.id, input.indicatorId), eq(observatoryIndicators.active, true))).limit(1);
    const [source] = await tx.select().from(observatorySources).where(and(eq(observatorySources.id, input.sourceId), eq(observatorySources.active, true))).limit(1);
    if (!indicator || !source) throw new Error("Select an active indicator and source");
    const duplicate = await tx.select({ id: observatoryObservations.id }).from(observatoryObservations).where(and(eq(observatoryObservations.indicatorId, input.indicatorId), eq(observatoryObservations.sourceId, input.sourceId), sql`${observatoryObservations.observationDate} = ${input.observationDate}`, input.periodLabel ? eq(observatoryObservations.periodLabel, input.periodLabel.trim()) : sql`${observatoryObservations.periodLabel} IS NULL`, sql`${observatoryObservations.id} <> ${input.observationId}`)).limit(1);
    if (duplicate.length) throw new Error("A duplicate observation already exists for this indicator, source, date, and period");
    const verificationTimestamp = input.verificationStatus && input.verificationStatus !== "unverified" ? new Date() : null;
    const patch = { indicatorId: input.indicatorId, sourceId: input.sourceId, value: input.value, valueLabel: input.valueLabel?.trim() || null, observationDate: input.observationDate, periodLabel: input.periodLabel?.trim() || null, notes: input.notes?.trim() || null, methodologyVersion: input.methodologyVersion.trim(), observationKind: input.observationKind ?? "reported" as const, collectionMethod: input.collectionMethod?.trim() || null, sourceTimestamp: input.sourceTimestamp ?? null, confidence: input.confidence ?? null, verificationStatus: input.verificationStatus ?? "unverified" as const, verificationNotes: input.verificationNotes?.trim() || null, verifiedBy: verificationTimestamp ? input.userId : null, verifiedAt: verificationTimestamp, status: "draft" as const, publishedBy: null, publishedAt: null };
    await tx.update(observatoryObservations).set(patch).where(eq(observatoryObservations.id, input.observationId));
    const [after] = await tx.select().from(observatoryObservations).where(eq(observatoryObservations.id, input.observationId)).limit(1);
    await tx.insert(adminDataAudit).values({ actorId: input.userId, entityType: "observatory", entityId: `observation:${input.observationId}`, action: "corrected", reason, beforeData: auditJson(before), afterData: auditJson(after) });
    return after;
  });
}

export async function setObservatoryObservationStatus(input: { observationId: number; status: "draft" | "published" | "archived"; reason: string; userId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const reason = requireAdminReason(input.reason);
  return db.transaction(async tx => {
    const [before] = await tx.select().from(observatoryObservations).where(eq(observatoryObservations.id, input.observationId)).limit(1).for("update");
    if (!before) throw new Error("Observation not found");
    if (input.status === "published") {
      const [indicator] = await tx.select({ id: observatoryIndicators.id }).from(observatoryIndicators).where(and(eq(observatoryIndicators.id, before.indicatorId), eq(observatoryIndicators.active, true))).limit(1);
      const [source] = await tx.select({ id: observatorySources.id }).from(observatorySources).where(and(eq(observatorySources.id, before.sourceId), eq(observatorySources.active, true))).limit(1);
      if (!indicator || !source || (before.value === null) === Boolean(before.valueLabel?.trim())) throw new Error("An active source, active indicator, and exactly one value are required before publication");
    }
    await tx.update(observatoryObservations).set(input.status === "published" ? { status: input.status, publishedBy: input.userId, publishedAt: new Date() } : { status: input.status, publishedBy: null, publishedAt: null }).where(eq(observatoryObservations.id, input.observationId));
    const [after] = await tx.select().from(observatoryObservations).where(eq(observatoryObservations.id, input.observationId)).limit(1);
    const action = input.status === "published" ? "published" as const : input.status === "archived" ? "archived" as const : "status_changed" as const;
    await tx.insert(adminDataAudit).values({ actorId: input.userId, entityType: "observatory", entityId: `observation:${input.observationId}`, action, reason, beforeData: auditJson(before), afterData: auditJson(after) });
    return after;
  });
}

export async function importObservatoryObservations(input: { sourceId: number; rows: ObservatoryCsvRow[]; userId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Observatory data service is unavailable");
  if (!input.rows.length || input.rows.length > 200) throw new Error("Import between 1 and 200 observation rows");
  const [source] = await db.select().from(observatorySources).where(and(eq(observatorySources.id, input.sourceId), eq(observatorySources.active, true))).limit(1);
  if (!source) throw new Error("Select an active source before importing");
  const codes = [...new Set(input.rows.map(row => row.indicatorCode.trim().toUpperCase()))];
  const found = await db.select().from(observatoryIndicators).where(and(inArray(observatoryIndicators.code, codes), eq(observatoryIndicators.active, true)));
  const indicators = new Map(found.map(row => [row.code, row]));
  const values = input.rows.map((row, index) => {
    const indicator = indicators.get(row.indicatorCode.trim().toUpperCase());
    if (!indicator) throw new Error(`CSV row ${index + 2} refers to an unknown or inactive indicator`);
    const hasNumber = row.value !== undefined && row.value.trim() !== "";
    const hasText = Boolean(row.valueLabel?.trim());
    if (hasNumber === hasText) throw new Error(`CSV row ${index + 2} must contain exactly one numeric or text value`);
    if (hasNumber && (!/^-?\d+(\.\d{1,6})?$/.test(row.value!.trim()) || !Number.isFinite(Number(row.value)) || Math.abs(Number(row.value)) > 999999999999.999999)) {
      throw new Error(`CSV row ${index + 2} has a numeric value outside the supported precision`);
    }
    if (hasText && row.valueLabel!.trim().length > 255) throw new Error(`CSV row ${index + 2} text value exceeds 255 characters`);
    if (row.periodLabel && row.periodLabel.length > 120) throw new Error(`CSV row ${index + 2} period label exceeds 120 characters`);
    if (!row.methodologyVersion.trim() || row.methodologyVersion.length > 48) throw new Error(`CSV row ${index + 2} has an invalid methodology version`);
    if (row.notes && row.notes.length > 5000) throw new Error(`CSV row ${index + 2} notes exceed 5,000 characters`);
    if (row.observationKind && !["reported", "estimate", "projection"].includes(row.observationKind)) throw new Error(`CSV row ${index + 2} has an invalid observation kind`);
    if (row.verificationStatus && !["unverified", "reviewed", "independently_verified"].includes(row.verificationStatus)) throw new Error(`CSV row ${index + 2} has an invalid verification status`);
    if (row.confidence && (!/^(100|[0-9]{1,2}(\.\d{1,2})?)$/.test(row.confidence) || Number(row.confidence) > 100)) throw new Error(`CSV row ${index + 2} has an invalid confidence`);
    if (row.sourceTimestamp && Number.isNaN(new Date(row.sourceTimestamp).getTime())) throw new Error(`CSV row ${index + 2} has an invalid source timestamp`);
    const observationDate = new Date(row.observationDate);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(row.observationDate) || Number.isNaN(observationDate.getTime()) || observationDate.toISOString().slice(0, 10) !== row.observationDate) {
      throw new Error(`CSV row ${index + 2} has an invalid observation date`);
    }
    return {
      indicatorId: indicator.id,
      sourceId: source.id,
      value: hasNumber ? row.value!.trim() : undefined,
      valueLabel: hasText ? row.valueLabel!.trim() : undefined,
      observationDate,
      periodLabel: row.periodLabel?.trim() || undefined,
      notes: row.notes?.trim() || undefined,
      methodologyVersion: row.methodologyVersion.trim(),
      observationKind: row.observationKind ?? "reported",
      collectionMethod: row.collectionMethod?.trim() || undefined,
      sourceTimestamp: row.sourceTimestamp ? new Date(row.sourceTimestamp) : undefined,
      confidence: row.confidence,
      verificationStatus: row.verificationStatus ?? "unverified",
      verificationNotes: undefined,
      status: "draft" as const,
      createdBy: input.userId,
    };
  });
  const duplicateKeys = new Set<string>();
  for (const value of values) {
    const key = `${value.indicatorId}|${value.sourceId}|${value.observationDate.toISOString()}|${value.periodLabel ?? ""}`;
    if (duplicateKeys.has(key)) throw new Error("CSV contains duplicate observations for the same indicator, source, date, and period");
    duplicateKeys.add(key);
    const existing = await db.select({ id: observatoryObservations.id }).from(observatoryObservations).where(and(eq(observatoryObservations.indicatorId, value.indicatorId), eq(observatoryObservations.sourceId, value.sourceId), sql`${observatoryObservations.observationDate} = ${value.observationDate}`, value.periodLabel ? eq(observatoryObservations.periodLabel, value.periodLabel) : sql`${observatoryObservations.periodLabel} IS NULL`)).limit(1);
    if (existing.length) throw new Error("CSV contains an observation that already exists in the Observatory");
  }
  await db.transaction(async tx => {
    const [result] = await tx.insert(observatoryObservations).values(values);
    await tx.insert(adminDataAudit).values({ actorId: input.userId, entityType: "observatory", entityId: `import:${source.id}:${Number(result.insertId)}`, action: "imported", reason: "CSV import created draft observations", beforeData: null, afterData: auditJson({ sourceId: source.id, count: values.length, status: "draft" }) });
  });
  return { count: values.length };
}
