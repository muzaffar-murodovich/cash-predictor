import { Building2, Banknote, AlertTriangle, Activity, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useSummary } from "@/lib/queries";
import { formatCurrency } from "@/lib/formatters";

export function SummaryCards() {
  const { data, isLoading, error, refetch, isFetching } = useSummary();

  const cards = [
    {
      label: "Jami filiallar",
      value: data ? `${data.total_branches} ta` : "—",
      icon: Building2,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Jami balans",
      value: data ? formatCurrency(data.total_balance) : "—",
      icon: Banknote,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Risk ostidagi filiallar",
      value: data ? `${data.branches_at_risk} ta` : "—",
      icon: AlertTriangle,
      color: data && data.branches_at_risk > 0 ? "text-amber-600" : "text-slate-500",
      bg: data && data.branches_at_risk > 0 ? "bg-amber-50" : "bg-slate-50",
    },
    {
      label: "Faol anomaliyalar",
      value: data ? `${data.active_anomalies} ta` : "—",
      icon: Activity,
      color: data && data.active_anomalies > 0 ? "text-red-600" : "text-slate-500",
      bg: data && data.active_anomalies > 0 ? "bg-red-50" : "bg-slate-50",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
          Umumiy ko'rsatkichlar
        </h2>
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

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">
          Ma'lumot yuklanmadi: {error.message}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="border-0 shadow-sm">
              <CardContent className="p-5">
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-7 w-32" />
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium text-slate-500 mb-1">{card.label}</p>
                      <p className="text-xl font-bold text-slate-800">{card.value}</p>
                    </div>
                    <div className={`rounded-lg p-2 ${card.bg}`}>
                      <Icon className={`h-5 w-5 ${card.color}`} />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {data && data.top_alerts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {data.top_alerts.slice(0, 3).map((alert, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs text-amber-800"
            >
              <AlertTriangle className="h-3 w-3" />
              {alert.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
