import { AlertOctagon, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnomalies } from "@/lib/queries";
import { formatDate, formatCurrency, formatPercent } from "@/lib/formatters";
import type { AnomalyItem } from "@/lib/api";

const SEVERITY_CONFIG = {
  critical: {
    badge: "bg-red-100 text-red-700 border-red-200",
    row: "bg-red-50/50",
    label: "Kritik",
  },
  warning: {
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    row: "bg-amber-50/30",
    label: "Ogohlantirish",
  },
  info: {
    badge: "bg-blue-100 text-blue-700 border-blue-200",
    row: "",
    label: "Ma'lumot",
  },
};

function AnomalyRow({ a }: { a: AnomalyItem }) {
  const sev = SEVERITY_CONFIG[a.severity];
  const diff = a.actual_balance - a.expected_balance;

  return (
    <tr className={`border-b border-slate-100 hover:bg-slate-50/80 transition-colors ${sev.row}`}>
      <td className="px-4 py-3">
        <div>
          <p className="text-sm font-medium text-slate-800">{a.branch_name}</p>
          <p className="text-xs text-slate-400">#{a.branch_id}</p>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-slate-600">{formatDate(a.date)}</td>
      <td className="px-4 py-3 text-sm font-medium text-slate-800">
        {formatCurrency(a.actual_balance)}
      </td>
      <td className="px-4 py-3 text-sm text-slate-500">
        {formatCurrency(a.expected_balance)}
      </td>
      <td className="px-4 py-3">
        <span className={`text-sm font-semibold ${diff > 0 ? "text-emerald-600" : "text-red-600"}`}>
          {diff > 0 ? "+" : ""}{formatPercent(a.deviation_percent)}
        </span>
      </td>
      <td className="px-4 py-3">
        <Badge className={`text-xs ${sev.badge}`}>{sev.label}</Badge>
      </td>
      <td className="px-4 py-3 max-w-[240px]">
        <p className="text-xs text-slate-500 truncate" title={a.message}>
          {a.message}
        </p>
      </td>
    </tr>
  );
}

export function AnomaliesTable() {
  const { data, isLoading, refetch, isFetching, error } = useAnomalies();

  const anomalies = data?.anomalies ?? [];
  const sorted = [...anomalies].sort((a, b) => {
    const order = { critical: 0, warning: 1, info: 2 };
    return order[a.severity] - order[b.severity];
  });

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertOctagon className="h-4 w-4 text-red-500" />
              Anomaliyalar
            </CardTitle>
            {!isLoading && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                {sorted.length} ta
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-7 px-2 text-slate-500"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0 pb-2">
        {error && (
          <p className="px-6 py-3 text-sm text-red-600">
            Anomaliyalar yuklanmadi: {error.message}
          </p>
        )}

        {isLoading ? (
          <div className="px-6 py-4 space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex items-center justify-center py-10 text-slate-400 text-sm">
            Hozircha anomaliyalar yo'q
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  {["Filial", "Sana", "Haqiqiy", "Kutilgan", "Og'ish", "Darajasi", "Xabar"].map(
                    (col) => (
                      <th
                        key={col}
                        className="px-4 py-2.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider"
                      >
                        {col}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {sorted.map((a, i) => (
                  <AnomalyRow key={i} a={a} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
