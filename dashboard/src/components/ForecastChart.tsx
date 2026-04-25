import { RefreshCw, TrendingUp } from "lucide-react";
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useForecast, useHistory } from "@/lib/queries";
import { formatDateShort, formatCurrencyCompact, formatCurrency, formatPercent } from "@/lib/formatters";

interface ForecastChartProps {
  branchId: number | null;
}

interface ChartPoint {
  date: string;
  actual?: number;
  forecast?: number;
  lower?: number;
  upper?: number;
  isForecast: boolean;
}

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-white shadow-lg p-3 text-xs space-y-1 min-w-[160px]">
      <p className="font-semibold text-slate-700 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
            <span className="text-slate-500">{p.name}</span>
          </span>
          <span className="font-medium text-slate-800">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

export function ForecastChart({ branchId }: ForecastChartProps) {
  const {
    data: historyData,
    isLoading: histLoading,
    refetch: refetchHistory,
    isFetching: histFetching,
  } = useHistory(branchId);

  const {
    data: forecastData,
    isLoading: fcLoading,
    refetch: refetchForecast,
    isFetching: fcFetching,
  } = useForecast(branchId);

  const isLoading = histLoading || fcLoading;
  const isFetching = histFetching || fcFetching;

  const refetch = () => {
    refetchHistory();
    refetchForecast();
  };

  const chartData: ChartPoint[] = [];
  const historyMap = new Map<string, number>();

  if (historyData) {
    for (const h of historyData.history) {
      historyMap.set(h.date.slice(0, 10), h.balance);
    }
    for (const [date, balance] of historyMap) {
      chartData.push({ date, actual: balance, isForecast: false });
    }
  }

  let forecastStartDate = "";
  if (forecastData) {
    forecastStartDate = forecastData.forecast[0]?.date?.slice(0, 10) ?? "";
    for (const f of forecastData.forecast) {
      const d = f.date.slice(0, 10);
      chartData.push({
        date: d,
        forecast: f.predicted_cash,
        lower: f.lower_bound,
        upper: f.upper_bound,
        isForecast: true,
      });
    }
  }

  chartData.sort((a, b) => a.date.localeCompare(b.date));

  const metrics = forecastData?.metrics;

  if (!branchId) {
    return (
      <Card className="border-0 shadow-sm h-full">
        <CardContent className="flex items-center justify-center h-72 text-slate-400 text-sm">
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
            <TrendingUp className="h-4 w-4 text-blue-600" />
            Tarixiy ma'lumot va prognoz
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={refetch}
            disabled={isFetching}
            className="h-7 px-2 text-slate-500"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
        <p className="text-xs text-slate-500">Oxirgi 30 kun + keyingi 7 kun</p>
      </CardHeader>

      <CardContent className="pb-4">
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDateShort}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                  interval={Math.floor(chartData.length / 6)}
                />
                <YAxis
                  tickFormatter={formatCurrencyCompact}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                  width={72}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                />

                {forecastStartDate && (
                  <ReferenceLine
                    x={forecastStartDate}
                    stroke="#94a3b8"
                    strokeDasharray="4 4"
                    label={{ value: "Bugun", position: "top", fontSize: 10, fill: "#64748b" }}
                  />
                )}

                <Area
                  type="monotone"
                  dataKey="upper"
                  name="Yuqori chegara"
                  fill="#dbeafe"
                  stroke="none"
                  fillOpacity={0.6}
                  legendType="none"
                />
                <Area
                  type="monotone"
                  dataKey="lower"
                  name="Quyi chegara"
                  fill="#ffffff"
                  stroke="none"
                  fillOpacity={1}
                  legendType="none"
                />

                <Line
                  type="monotone"
                  dataKey="actual"
                  name="Haqiqiy"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="forecast"
                  name="Prognoz"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="5 3"
                  dot={false}
                  activeDot={{ r: 4 }}
                  connectNulls={false}
                />
              </ComposedChart>
            </ResponsiveContainer>

            {metrics && (
              <div className="mt-3 flex gap-4 border-t pt-3">
                <div className="flex-1 text-center">
                  <p className="text-xs text-slate-400 mb-0.5">MAPE</p>
                  <p className="text-sm font-semibold text-slate-700">
                    {formatPercent(metrics.mape)}
                  </p>
                </div>
                <div className="w-px bg-slate-100" />
                <div className="flex-1 text-center">
                  <p className="text-xs text-slate-400 mb-0.5">RMSE</p>
                  <p className="text-sm font-semibold text-slate-700">
                    {formatCurrencyCompact(metrics.rmse)}
                  </p>
                </div>
                <div className="w-px bg-slate-100" />
                <div className="flex-1 text-center">
                  <p className="text-xs text-slate-400 mb-0.5">Model</p>
                  <p className="text-sm font-semibold text-slate-700">
                    {forecastData?.model_used ?? "—"}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
