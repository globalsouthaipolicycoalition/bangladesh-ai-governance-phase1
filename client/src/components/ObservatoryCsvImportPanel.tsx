import { useState } from "react";
import { FileUp } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { parseObservatoryCsv, type ObservatoryCsvRow } from "@shared/observatoryCsv";
import { useLocale } from "../contexts/LocaleContext";

type Source = { id: number; name: string; publisher: string; active: boolean };

export default function ObservatoryCsvImportPanel({ sources, onImported }: { sources: Source[]; onImported: () => Promise<void> }) {
  const { isBangla } = useLocale();
  const t = (en: string, bn: string) => isBangla ? bn : en;
  const [sourceId, setSourceId] = useState("");
  const [rows, setRows] = useState<ObservatoryCsvRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [message, setMessage] = useState("");
  const importCsv = trpc.observatory.importObservations.useMutation({
    onSuccess: async result => {
      setMessage(`${result.count} ${t("observations imported as drafts. Review and publish them individually.", "টি পর্যবেক্ষণ খসড়া হিসেবে আমদানি হয়েছে। যাচাই করে আলাদাভাবে প্রকাশ করুন।")}`);
      setRows([]);
      setFileName("");
      const input = document.getElementById("observatory-csv-file") as HTMLInputElement | null;
      if (input) input.value = "";
      await onImported();
    },
    onError: error => setMessage(`${t("Import failed", "আমদানি ব্যর্থ")}: ${error.message}`),
  });
  const readFile = async (file?: File) => {
    setRows([]);
    setFileName("");
    setMessage("");
    if (!file) return;
    if (file.size > 1024 * 1024) { setMessage(t("CSV file must be 1 MiB or smaller.", "CSV ফাইল ১ MiB বা তার কম হতে হবে।")); return; }
    try {
      const parsed = parseObservatoryCsv(await file.text());
      setRows(parsed);
      setFileName(file.name);
      setMessage(`${parsed.length} ${t("rows ready for preview.", "টি সারি preview-এর জন্য প্রস্তুত।")}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("Could not read CSV.", "CSV পড়া যায়নি।"));
    }
  };
  const activeSources = sources.filter(source => source.active);
  return <div className="observatory-csv-import">
    <h3><FileUp size={17} /> {t("Import observations from CSV", "CSV থেকে পর্যবেক্ষণ আমদানি")}</h3>
    <p>{t("Required columns: indicator_code, observation_date, methodology_version, and exactly one of value or value_label. Imports are saved as drafts.", "প্রয়োজনীয় কলাম: indicator_code, observation_date, methodology_version এবং value বা value_label-এর ঠিক একটি। আমদানিকৃত তথ্য খসড়া হিসেবে সংরক্ষিত হবে।")}</p>
    <a className="panel-link" download="observatory-import-template.csv" href={`data:text/csv;charset=utf-8,${encodeURIComponent("indicator_code,observation_date,value,value_label,period_label,methodology_version,notes\nAI-USE,2026-01-01,12.5,,2026,1.0,Example observation")}`}>{t("Download CSV template", "CSV নমুনা ডাউনলোড করুন")}</a>
    <div className="observatory-inline-fields"><label>{t("Source for this file", "এই ফাইলের উৎস")}<select value={sourceId} onChange={event => setSourceId(event.target.value)}><option value="">{t("Choose an active source…", "সক্রিয় উৎস বাছুন…")}</option>{activeSources.map(source => <option key={source.id} value={source.id}>{source.publisher} — {source.name}</option>)}</select></label><label>{t("CSV file (max 1 MiB, 200 rows)", "CSV ফাইল (সর্বোচ্চ ১ MiB, ২০০ সারি)")}<input id="observatory-csv-file" type="file" accept=".csv,text/csv" onChange={event => void readFile(event.target.files?.[0])} /></label></div>
    {rows.length > 0 && <><p><strong>{fileName}</strong> · {rows.length} {t("rows", "সারি")}</p><div className="observatory-import-preview"><table><thead><tr><th>{t("Indicator", "সূচক")}</th><th>{t("Date", "তারিখ")}</th><th>{t("Value", "মান")}</th><th>{t("Period", "সময়কাল")}</th></tr></thead><tbody>{rows.slice(0, 5).map((row, index) => <tr key={`${row.indicatorCode}-${row.observationDate}-${index}`}><td>{row.indicatorCode}</td><td>{row.observationDate}</td><td>{row.value ?? row.valueLabel}</td><td>{row.periodLabel ?? "—"}</td></tr>)}</tbody></table>{rows.length > 5 && <small>{t("Preview shows the first five rows.", "preview-তে প্রথম পাঁচটি সারি দেখানো হয়েছে।")}</small>}</div><button className="button button-dark" disabled={!sourceId || importCsv.isPending} onClick={() => importCsv.mutate({ sourceId: Number(sourceId), rows })}>{importCsv.isPending ? t("Importing…", "আমদানি হচ্ছে…") : t("Import as drafts", "খসড়া হিসেবে আমদানি করুন")}</button></>}
    {message && <p role="status">{message}</p>}
  </div>;
}
