import { ArrowDownToLine, ArrowUpFromLine, Check, RefreshCw, Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRecommendations } from "@/lib/queries";
import { formatDate, formatCurrency } from "@/lib/formatters";
import type { RecommendationItem } from "@/lib/api";

interface RecommendationsListProps {
  branchId: number | null;
}

const ACTION_CONFIG = {
  deliver: {
    label: "Yetkazib berish",
    icon: ArrowDownToLine,
    cardClass: "border-l-4 border-l-emerald-500 bg-emerald-50",
    iconClass: "text-emerald-600",
    textClass: "text-emerald-800",
  },
  collect: {
    label: "Yig'ib olish",
    icon: ArrowUpFromLine,
    cardClass: "border-l-4 border-l-amber-500 bg-amber-50",
    iconClass: "text-amber-600",
    textClass: "text-amber-800",
  },
  none: {
    label: "Harakat kerak emas",
    icon: Check,
    cardClass: "border-l-4 border-l-slate-300 bg-slate-50",
    iconClass: "text-slate-400",
    textClass: "text-slate-600",
  },
};

const PRIORITY_BADGE: Record<string, string> = {
  high: "bg-red-100 text-red-700 border-red-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-slate-100 text-slate-600 border-slate-200",
};

const PRIORITY_LABEL: Record<string, string> = {
  high: "Yuqori",
  medium: "O'rta",
  low: "Past",
};

function RecommendationCard({ rec }: { rec: RecommendationItem }) {
  const cfg = ACTION_CONFIG[rec.action];
  const Icon = cfg.icon;

  return (
    <div className={`rounded-lg p-3 ${cfg.cardClass}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${cfg.iconClass}`} />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-semibold ${cfg.textClass}`}>
                {cfg.label}
              </span>
              {rec.action !== "none" && (
                <span className={`text-xs font-bold ${cfg.textClass}`}>
                  {formatCurrency(rec.amount)}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{rec.reason}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-xs text-slate-400">{formatDate(rec.date)}</span>
          <Badge
            className={`text-[10px] px-1.5 py-0 h-4 ${PRIORITY_BADGE[rec.priority]}`}
          >
            {PRIORITY_LABEL[rec.priority]}
          </Badge>
        </div>
      </div>
    </div>
  );
}

export function RecommendationsList({ branchId }: RecommendationsListProps) {
  const { data, isLoading, refetch, isFetching, error } = useRecommendations(branchId);

  if (!branchId) {
    return (
      <Card className="border-0 shadow-sm h-full">
        <CardContent className="flex items-center justify-center h-40 text-slate-400 text-sm">
          Filial tanlanmagan
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            Inkassatsiya tavsiyalari
          </CardTitle>
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
        {data && (
          <p className="text-xs text-slate-500">
            Xavfsiz diapazon: {formatCurrency(data.min_safe_balance)} —{" "}
            {formatCurrency(data.max_safe_balance)}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-2 pb-4">
        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
            Tavsiyalar yuklanmadi: {error.message}
          </p>
        )}

        {isLoading &&
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}

        {!isLoading && data?.recommendations.map((rec, i) => (
          <RecommendationCard key={i} rec={rec} />
        ))}

        {!isLoading && data?.recommendations.length === 0 && (
          <div className="flex items-center justify-center py-8 text-slate-400 text-sm">
            Tavsiyalar yo'q
          </div>
        )}
      </CardContent>
    </Card>
  );
}
