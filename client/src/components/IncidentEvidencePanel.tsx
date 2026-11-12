import { useRef, useState, type FormEvent } from "react";
import { Download, FileUp, ShieldCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocale } from "../contexts/LocaleContext";

type IncidentEvidenceMetadata = {
  id: number;
  fileName: string;
  mimeType: string;
  fileSize: number;
  uploadedBy: number;
  createdAt: Date | string;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_MIME_TYPES = [
  "application/pdf", "image/jpeg", "image/png", "image/gif", "image/webp", "text/plain",
  "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

function formatFileSize(size: number) {
  return size >= 1024 * 1024 ? `${(size / (1024 * 1024)).toFixed(1)} MiB` : `${Math.max(1, Math.round(size / 1024))} KiB`;
}

function fileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Could not read the selected file"));
    reader.onerror = () => reject(new Error("Could not read the selected file"));
    reader.readAsDataURL(file);
  });
}

export default function IncidentEvidencePanel({ incidentId, evidence, locked }: { incidentId: number; evidence: IncidentEvidenceMetadata[]; locked: boolean }) {
  const { isBangla } = useLocale();
  const t = (en: string, bn: string) => isBangla ? bn : en;
  const [file, setFile] = useState<File | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState("");
  const [downloadLinks, setDownloadLinks] = useState<Record<number, string>>({});
  const utils = trpc.useUtils();
  const upload = trpc.incident.uploadEvidence.useMutation({
    onSuccess: async () => {
      setFile(null);
      if (fileInput.current) fileInput.current.value = "";
      setNotice(t("Evidence uploaded and added to the audit timeline.", "প্রমাণ ফাইল আপলোড হয়ে অডিট টাইমলাইনে যুক্ত হয়েছে।"));
      await utils.incident.detail.invalidate({ incidentId });
    },
    onError: error => setNotice(error.message),
  });
  const download = trpc.incident.downloadEvidence.useMutation({
    onSuccess: async result => {
      setDownloadLinks(current => ({ ...current, [download.variables?.evidenceId ?? 0]: result.url }));
      setNotice(t("A temporary authorized download link is ready.", "সাময়িক অনুমোদিত ডাউনলোড লিংক তৈরি হয়েছে।"));
      await utils.incident.detail.invalidate({ incidentId });
    },
    onError: error => setNotice(error.message),
  });

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice("");
    if (!file) {
      setNotice(t("Choose a file first.", "আগে একটি ফাইল বেছে নিন।"));
      return;
    }
    if (file.size < 1 || file.size > MAX_FILE_SIZE) {
      setNotice(t("Choose a non-empty file no larger than 10 MiB.", "খালি নয় এবং ১০ MiB-এর বেশি নয়—এমন ফাইল বেছে নিন।"));
      return;
    }
    if (!ACCEPTED_MIME_TYPES.includes(file.type.toLowerCase())) {
      setNotice(t("This file type is not supported.", "এই ফাইলের ধরন সমর্থিত নয়।"));
      return;
    }
    try {
      const base64 = await fileAsDataUrl(file);
      upload.mutate({ incidentId, fileName: file.name, mimeType: file.type, base64 });
    } catch (error) {
      setNotice(error instanceof Error ? error.message : t("Could not read the selected file.", "নির্বাচিত ফাইল পড়া যায়নি।"));
    }
  };

  return <section className="incident-evidence-panel" aria-labelledby="incident-evidence-title">
    <div className="incident-evidence-heading"><h3 id="incident-evidence-title"><ShieldCheck size={16} /> {t("Evidence files", "প্রমাণের ফাইল")}</h3><span>{t("Private to the reporter and authorized incident managers", "প্রতিবেদক ও অনুমোদিত ঘটনা ব্যবস্থাপকদের জন্য সীমিত")}</span></div>
    <p className="incident-evidence-help">{t("PDF, JPEG, PNG, GIF, WebP, TXT, DOC/DOCX and XLS/XLSX; maximum 10 MiB per file. Files are not malware-scanned. Do not upload credentials or unnecessary personal data.", "PDF, JPEG, PNG, GIF, WebP, TXT, DOC/DOCX ও XLS/XLSX; প্রতি ফাইল সর্বোচ্চ ১০ MiB। ফাইলে malware scan করা হয় না। পাসওয়ার্ড বা অপ্রয়োজনীয় ব্যক্তিগত তথ্য আপলোড করবেন না।")}</p>
    {evidence.length > 0 ? <ul className="incident-evidence-list">{evidence.map(item => <li key={item.id}>
      <div><strong>{item.fileName}</strong><small>{item.mimeType} · {formatFileSize(item.fileSize)} · {new Date(item.createdAt).toLocaleString(isBangla ? "bn-BD" : "en-US")}</small></div>
      {downloadLinks[item.id] ? <a className="review-action open incident-download-link" href={downloadLinks[item.id]} target="_blank" rel="noopener noreferrer"><Download size={14} /> {t("Download", "ডাউনলোড")}</a> : <button type="button" className="review-action open incident-download-link" disabled={download.isPending} onClick={() => download.mutate({ evidenceId: item.id })}><Download size={14} /> {download.isPending ? t("Preparing…", "তৈরি হচ্ছে…") : t("Get secure link", "নিরাপদ লিংক নিন")}</button>}
    </li>)}</ul> : <p className="incident-muted">{t("No files are attached to this report.", "এই প্রতিবেদনে কোনো ফাইল সংযুক্ত নেই।")}</p>}
    {locked ? <p className="incident-muted">{t("Files cannot be added after the report is closed or dismissed.", "প্রতিবেদন বন্ধ বা খারিজ হলে নতুন ফাইল যোগ করা যায় না।")}</p> : <form className="incident-evidence-upload" onSubmit={submit}>
      <label>{t("Attach a file", "প্রমাণ ফাইল সংযুক্ত করুন")}<input ref={fileInput} type="file" accept={ACCEPTED_MIME_TYPES.join(",")} disabled={upload.isPending} onChange={event => { setFile(event.currentTarget.files?.[0] ?? null); setNotice(""); }} /></label>
      <button type="submit" className="review-action open" disabled={!file || upload.isPending}><FileUp size={15} /> {upload.isPending ? t("Uploading…", "আপলোড হচ্ছে…") : t("Upload evidence", "প্রমাণ আপলোড")}</button>
    </form>}
    <p aria-live="polite" role={upload.isError || download.isError ? "alert" : "status"} className="incident-evidence-feedback">{notice}</p>
  </section>;
}
