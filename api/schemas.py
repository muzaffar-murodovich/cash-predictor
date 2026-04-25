"""
API javob modellari (Pydantic).
Frontend dasturchi bu strukturalarni kutadi.
"""
from datetime import date
from typing import Literal
from pydantic import BaseModel, Field


# ============ Branches ============

class Branch(BaseModel):
    branch_id: int
    name: str
    city: str
    current_balance: int
    currency: str = "UZS"


class BranchesResponse(BaseModel):
    branches: list[Branch]


# ============ Forecast ============

class ForecastDay(BaseModel):
    date: date
    predicted_cash: int
    lower_bound: int
    upper_bound: int
    is_payday: bool
    is_pre_holiday: bool


class ForecastResponse(BaseModel):
    branch_id: int
    branch_name: str
    model_used: str
    forecast: list[ForecastDay]
    metrics: dict[str, float]


# ============ Recommendations ============

class Recommendation(BaseModel):
    date: date
    action: Literal["deliver", "collect", "none"]
    amount: int
    reason: str
    priority: Literal["high", "medium", "low"]


class RecommendationsResponse(BaseModel):
    branch_id: int
    min_safe_balance: int
    max_safe_balance: int
    recommendations: list[Recommendation]


# ============ Anomalies ============

class Anomaly(BaseModel):
    branch_id: int
    branch_name: str
    date: date
    actual_balance: int
    expected_balance: int
    deviation_percent: float
    severity: Literal["critical", "warning", "info"]
    message: str


class AnomaliesResponse(BaseModel):
    anomalies: list[Anomaly]


# ============ Dashboard summary ============

class TopAlert(BaseModel):
    branch_id: int
    type: str
    message: str


class Next24hForecast(BaseModel):
    expected_inflow: int
    expected_outflow: int
    net_change: int


class DashboardSummary(BaseModel):
    total_branches: int
    total_balance: int
    branches_at_risk: int
    active_anomalies: int
    next_24h_forecast: Next24hForecast
    top_alerts: list[TopAlert]


# ============ History ============

class HistoryDay(BaseModel):
    date: date
    balance: int


class HistoryResponse(BaseModel):
    branch_id: int
    history: list[HistoryDay]


# ============ Health ============

class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    version: str = "1.0.0"


# ============ Errors ============

class ErrorResponse(BaseModel):
    error: str
    message: str
    status_code: int
