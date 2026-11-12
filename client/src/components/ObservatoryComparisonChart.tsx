import { useEffect, useMemo, useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../server/routers";
import { useLocale } from "../contexts/LocaleContext";

type PublicData = inferRouterOutputs<AppRouter>["observatory"]["publicData"];
const colors = ["#087a4a", "#174c78", "#be5c32", "#7b5aa6", "#a18413", "#177f82"];

export default function ObservatoryComparisonChart({ data }: { data: PublicData }) {
  const { isBangla } = useLocale();
  const t = (en: string, bn: string) => isBangla ? bn : en;
  const numericIndicators = useMemo(() => {
    const ids = new Set(data.observations.filter(row => row.observation.value !== null).map(row => row.indicator.id));
    return data.indicators.filter(indicator => ids.has(indicator.id));
  }, [data]);
  const [indicatorId, setIndicatorId] = useState(0);
  useEffect(() => {
    if (numericIndicators.length && !numericIndicators.some(item => item.id === indicatorId)) setIndicatorId(numericIndicators[0]!.id);
  }, [numericIndicators, indicatorId]);
  const indicator = numericIndicators.find(item => item.id === indicatorId);
  const observations = data.observations.filter(row => row.indicator.id === indicatorId && row.observation.value !== null);
  const sourceLabel = (source: { name: string; publisher: string }) => `${source.publisher} — ${source.name}`;
  const sources = [...new Set(observations.map(row => sourceLabel(row.source)))];
  const chartRows = useMemo(() => {
    const points = new Map<string, Record<string, string | number>>();
    for (const row of observations) {
      const date = new Date(row.observation.observationDate).toISOString().slice(0, 10);
      const point = points.get(date) ?? { date };
      point[sourceLabel(row.source)] = Number(row.observation.value);
      points.set(date, point);
    }
    return [...points.values()].sort((a, b) => String(a.date).localeCompare(String(b.date)));
  }, [observations]);

  if (!numericIndicators.length) return null;
  return <section className="observatory-section observatory-comparison" aria-labelledby="observatory-comparison-title">
    <div className="observatory-section-title"><div><span className="card-kicker">{t("TREND COMPARISON", "সময়ভিত্তিক তুলনা")}</span><h2 id="observatory-comparison-title">{t("Compare a published indicator", "প্রকাশিত সূচকের তুলনা")}</h2></div>
      <label>{t("Indicator", "সূচক")} <select value={indicatorId} onChange={event => setIndicatorId(Number(event.target.value))}>{numericIndicators.map(item => <option key={item.id} value={item.id}>{item.code} — {item.title}</option>)}</select></label>
    </div>
    <p className="observatory-admin-note">{t("Values are compared only within the selected indicator and its unit. Lines distinguish sources; missing dates are not interpolated.", "নির্বাচিত সূচক ও একই এককের মানই তুলনা করা হয়েছে। রেখাগুলো উৎস আলাদা করে; অনুপস্থিত তারিখের মান অনুমান করে পূরণ করা হয়নি।")}</p>
    {chartRows.length < 2 ? <p className="observatory-empty compact">{t("At least two dated numeric observations are needed to draw a trend.", "প্রবণতার রেখাচিত্রের জন্য অন্তত দুটি তারিখযুক্ত সংখ্যাগত পর্যবেক্ষণ দরকার।")}</p> : <div role="img" aria-label={`${indicator?.title ?? "Indicator"} ${t("trend by date and source", "তারিখ ও উৎস অনুযায়ী প্রবণতা")}`} style={{ width: "100%", height: 320 }}>
      <ResponsiveContainer>
        <LineChart data={chartRows} margin={{ top: 12, right: 18, left: 4, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#dce4de" />
          <XAxis dataKey="date" tickFormatter={value => new Date(`${value}T00:00:00`).toLocaleDateString(isBangla ? "bn-BD" : "en-BD", { month: "short", year: "2-digit" })} />
          <YAxis width={58} />
          <Tooltip labelFormatter={value => new Date(`${value}T00:00:00`).toLocaleDateString(isBangla ? "bn-BD" : "en-BD")} />
          <Legend />
          {sources.map((source, index) => <Line key={source} type="linear" dataKey={source} name={source} connectNulls={false} stroke={colors[index % colors.length]} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />)}
        </LineChart>
      </ResponsiveContainer>
    </div>}
    {indicator?.unit && <small>{t("Unit", "একক")}: {indicator.unit}</small>}
  </section>;
}
