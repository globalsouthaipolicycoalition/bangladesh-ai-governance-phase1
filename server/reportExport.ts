import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { reportSnapshot } from "./agarasDb";
import { ATLAS_DISCLAIMER, SELF_REPORTED_NOTICE } from "@shared/bangladesh";

export type ReportLanguage = "en" | "bn" | "bilingual";
type Labels = { title: string; system: string; assessment: string; methodology: string; verification: string; readiness: string; evidence: string; controls: string; findings: string; noFindings: string; notAnswered: string; evidenceStatus: string; score: string; severity: string; status: string; recommendation: string; notice: string; disclaimer: string; summary: string };
const REPORT_LABELS: Record<ReportLanguage, Labels> = {
  en: { title: "Bangladesh AI Readiness Assessment Report", system: "Bangladesh AI Readiness Assessment System", assessment: "Assessment", methodology: "Methodology", verification: "Verification", readiness: "Readiness score", evidence: "Evidence coverage", controls: "Controls", findings: "Findings", noFindings: "No findings recorded.", notAnswered: "Not answered", evidenceStatus: "Evidence status", score: "Score", severity: "Severity", status: "Status", recommendation: "Recommendation", notice: SELF_REPORTED_NOTICE, disclaimer: ATLAS_DISCLAIMER, summary: "Summary" },
  bn: { title: "বাংলাদেশ AI প্রস্তুতি মূল্যায়ন প্রতিবেদন", system: "বাংলাদেশ AI প্রস্তুতি মূল্যায়ন ব্যবস্থা", assessment: "মূল্যায়ন", methodology: "পদ্ধতি", verification: "যাচাই", readiness: "প্রস্তুতি স্কোর", evidence: "প্রমাণের কাভারেজ", controls: "কন্ট্রোল", findings: "ফাইন্ডিংস", noFindings: "কোনো ফাইন্ডিং রেকর্ড করা হয়নি।", notAnswered: "উত্তর দেওয়া হয়নি", evidenceStatus: "প্রমাণের অবস্থা", score: "স্কোর", severity: "তীব্রতা", status: "অবস্থা", recommendation: "সুপারিশ", notice: "স্ব-প্রতিবেদিত মূল্যায়ন — স্বাধীনভাবে যাচাই করা হয়নি।", disclaimer: "এই প্রতিবেদন মূল্যায়নের ফলাফল; এটি আইনি পরামর্শ, সরকারি সার্টিফিকেশন, ISO স্বীকৃতি বা স্বাধীন নিশ্চয়তা নয়।", summary: "সারসংক্ষেপ" },
  bilingual: { title: "Bangladesh AI Readiness Assessment Report / বাংলাদেশ AI প্রস্তুতি মূল্যায়ন প্রতিবেদন", system: "Bangladesh AI Readiness Assessment System / বাংলাদেশ AI প্রস্তুতি মূল্যায়ন ব্যবস্থা", assessment: "Assessment / মূল্যায়ন", methodology: "Methodology / পদ্ধতি", verification: "Verification / যাচাই", readiness: "Readiness score / প্রস্তুতি স্কোর", evidence: "Evidence coverage / প্রমাণের কাভারেজ", controls: "Controls / কন্ট্রোল", findings: "Findings / ফাইন্ডিংস", noFindings: "No findings recorded. / কোনো ফাইন্ডিং রেকর্ড করা হয়নি।", notAnswered: "Not answered / উত্তর দেওয়া হয়নি", evidenceStatus: "Evidence status / প্রমাণের অবস্থা", score: "Score / স্কোর", severity: "Severity / তীব্রতা", status: "Status / অবস্থা", recommendation: "Recommendation / সুপারিশ", notice: `${SELF_REPORTED_NOTICE} / স্ব-প্রতিবেদিত মূল্যায়ন — স্বাধীনভাবে যাচাই করা হয়নি।`, disclaimer: `${ATLAS_DISCLAIMER} / এই প্রতিবেদন মূল্যায়নের ফলাফল; এটি আইনি পরামর্শ, সরকারি সার্টিফিকেশন, ISO স্বীকৃতি বা স্বাধীন নিশ্চয়তা নয়।`, summary: "Summary / সারসংক্ষেপ" },
};

function asText(value: unknown) { if (value === null || value === undefined) return ""; return typeof value === "object" ? JSON.stringify(value) : String(value); }
export function reportFileName(assessmentId: number, language: ReportLanguage, extension: "pdf" | "xlsx") { return `bangladesh-ai-readiness-report-${assessmentId}-${language}.${extension}`; }

export async function buildPdfReport(assessmentId: number, userId: number, language: ReportLanguage = "en") {
  const report = await reportSnapshot(assessmentId, userId); if (!report) return undefined; const labels = REPORT_LABELS[language];
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 48, info: { Title: `${labels.title} — ${report.assessment.title}` } }); const chunks: Buffer[] = [];
    doc.on("data", chunk => chunks.push(Buffer.from(chunk))); doc.on("end", () => resolve(Buffer.concat(chunks))); doc.on("error", reject);
    const banglaFont = join(process.cwd(), "assets/fonts/NotoSansBengali-Regular.ttf"); if (language !== "en" && existsSync(banglaFont)) doc.font(banglaFont);
    doc.fontSize(22).fillColor("#123B36").text(labels.title); doc.moveDown(0.3).fontSize(10).fillColor("#667085").text(labels.system);
    doc.moveDown(1).fontSize(15).fillColor("#123B36").text(asText(report.assessment.title)); doc.fontSize(10).fillColor("#667085").text(`${labels.methodology}: ${asText(report.methodology)} · ${labels.verification}: ${asText(report.verification)}`);
    doc.moveDown(1).fontSize(12).fillColor("#123B36").text(`${labels.readiness}: ${asText(report.assessment.score)} / 100`); doc.text(`${labels.evidence}: ${asText(report.assessment.evidenceCoverage)}%`);
    doc.moveDown(1).fontSize(14).text(labels.controls);
    for (const row of report.controls as Array<{ control?: { code?: string; title?: string }; assignment?: { responseScore?: number | null; evidenceStatus?: string } }>) { doc.moveDown(0.35).fontSize(9).fillColor("#123B36").text(`${asText(row.control?.code)} — ${asText(row.control?.title)}`); doc.fontSize(8).fillColor("#667085").text(`${labels.score}: ${asText(row.assignment?.responseScore ?? labels.notAnswered)} · ${labels.evidenceStatus}: ${asText(row.assignment?.evidenceStatus)}`); }
    doc.moveDown(1).fontSize(14).fillColor("#123B36").text(labels.findings); if (!report.findings.length) doc.fontSize(9).fillColor("#667085").text(labels.noFindings);
    for (const finding of report.findings) doc.moveDown(0.35).fontSize(9).fillColor("#123B36").text(`${asText(finding.title)} · ${asText(finding.severity)} · ${asText(finding.status)}`).fontSize(8).fillColor("#667085").text(asText(finding.recommendation));
    doc.moveDown(1).fontSize(8).fillColor("#667085").text(`${labels.notice} ${labels.disclaimer}`); doc.end();
  });
}

export async function buildExcelReport(assessmentId: number, userId: number, language: ReportLanguage = "en") {
  const report = await reportSnapshot(assessmentId, userId); if (!report) return undefined; const labels = REPORT_LABELS[language]; const workbook = new ExcelJS.Workbook(); workbook.creator = "Bangladesh AI Readiness Assessment";
  const summary = workbook.addWorksheet(labels.summary); summary.addRows([[labels.title], [labels.assessment, report.assessment.title], [labels.methodology, report.methodology], [labels.verification, report.verification], [labels.readiness, Number(report.assessment.score)], [labels.evidence, Number(report.assessment.evidenceCoverage)], [language === "en" ? "Notice" : language === "bn" ? "নোটিশ" : "Notice / নোটিশ", labels.notice], [language === "en" ? "Disclaimer" : language === "bn" ? "দাবিত্যাগ" : "Disclaimer / দাবিত্যাগ", labels.disclaimer]]); summary.getColumn(1).width = 28; summary.getColumn(2).width = 80;
  const controls = workbook.addWorksheet(labels.controls); controls.columns = [{ header: "Code / কোড", key: "code", width: 16 }, { header: language === "en" ? "Title" : language === "bn" ? "শিরোনাম" : "Title / শিরোনাম", key: "title", width: 48 }, { header: labels.score, key: "score", width: 12 }, { header: labels.evidenceStatus, key: "evidence", width: 22 }];
  for (const row of report.controls as Array<{ control?: { code?: string; title?: string }; assignment?: { responseScore?: number | null; evidenceStatus?: string } }>) controls.addRow({ code: row.control?.code, title: row.control?.title, score: row.assignment?.responseScore ?? "", evidence: row.assignment?.evidenceStatus ?? "" });
  const findings = workbook.addWorksheet(labels.findings); findings.columns = [{ header: language === "en" ? "Title" : language === "bn" ? "শিরোনাম" : "Title / শিরোনাম", key: "title", width: 44 }, { header: labels.severity, key: "severity", width: 16 }, { header: labels.status, key: "status", width: 18 }, { header: labels.recommendation, key: "recommendation", width: 70 }]; for (const finding of report.findings) findings.addRow(finding);
  for (const sheet of [summary, controls, findings]) { sheet.views = [{ state: "frozen", ySplit: 1 }]; sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } }; sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF172337" } }; }
  return Buffer.from(await workbook.xlsx.writeBuffer());
}
