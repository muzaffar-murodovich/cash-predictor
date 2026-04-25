const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function fetchJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) {
    throw new Error(`API xatosi: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export type DashboardSummary = {
  total_branches: number;
  total_balance: number;
  branches_at_risk: number;
  active_anomalies: number;
  next_24h_forecast: {
    expected_inflow: number;
    expected_outflow: number;
    net_change: number;
  };
  top_alerts: Array<{
    branch_id: number;
    type: string;
    message: string;
  }>;
};

export type Branch = {
  branch_id: number;
  name: string;
  city: string;
  current_balance: number;
  currency: string;
};

export type ForecastItem = {
  date: string;
  predicted_cash: number;
  lower_bound: number;
  upper_bound: number;
  is_payday: boolean;
  is_pre_holiday: boolean;
};

export type ForecastResponse = {
  branch_id: number;
  branch_name: string;
  model_used: string;
  forecast: ForecastItem[];
  metrics: { mape: number; rmse: number };
};

export type RecommendationItem = {
  date: string;
  action: "deliver" | "collect" | "none";
  amount: number;
  reason: string;
  priority: "high" | "medium" | "low";
};

export type RecommendationsResponse = {
  branch_id: number;
  min_safe_balance: number;
  max_safe_balance: number;
  recommendations: RecommendationItem[];
};

export type AnomalyItem = {
  branch_id: number;
  branch_name: string;
  date: string;
  actual_balance: number;
  expected_balance: number;
  deviation_percent: number;
  severity: "critical" | "warning" | "info";
  message: string;
};

export type AnomaliesResponse = {
  anomalies: AnomalyItem[];
};

export type HistoryItem = { date: string; balance: number };

export type HistoryResponse = {
  branch_id: number;
  history: HistoryItem[];
};

export const api = {
  getSummary: () => fetchJSON<DashboardSummary>("/api/dashboard/summary"),
  getBranches: () => fetchJSON<Branch[]>("/api/branches"),
  getForecast: (id: number, days = 7) =>
    fetchJSON<ForecastResponse>(`/api/forecast/${id}?days=${days}`),
  getRecommendations: (id: number, days = 7) =>
    fetchJSON<RecommendationsResponse>(`/api/recommendations/${id}?days=${days}`),
  getAnomalies: () => fetchJSON<AnomaliesResponse>("/api/anomalies"),
  getHistory: (id: number, days = 30) =>
    fetchJSON<HistoryResponse>(`/api/history/${id}?days=${days}`),
};
