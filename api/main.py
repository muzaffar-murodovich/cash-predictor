"""
FastAPI server - Cash Forecast API.

Ishga tushirish:
    cd cash_forecast
    pipenv shell
    uvicorn api.main:app --reload

Swagger UI: http://localhost:8000/docs
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from .optimizer import (
    detect_anomalies,
    get_safe_bounds,
    is_pre_holiday,
    make_recommendations,
)
from .predictor import load_branches, load_synthetic_data, predictor
from .schemas import (
    AnomaliesResponse,
    Anomaly,
    Branch,
    BranchesResponse,
    DashboardSummary,
    ForecastDay,
    ForecastResponse,
    HealthResponse,
    HistoryDay,
    HistoryResponse,
    Next24hForecast,
    Recommendation,
    RecommendationsResponse,
    TopAlert,
)

# Global ma'lumotlar (startup'da yuklanadi)
_branches_df = None
_data_df = None
_current_balances = None  # branch_id -> balance


@asynccontextmanager
async def lifespan(app: FastAPI):
    """App startup va shutdown."""
    global _branches_df, _data_df, _current_balances

    print("[startup] Modellarni yuklash...")
    predictor.load()

    print("[startup] Datani yuklash...")
    _branches_df = load_branches()
    _data_df = load_synthetic_data()

    # Hozirgi balans = oxirgi sanadagi qoldiq
    last_date = _data_df["date"].max()
    last_balances = _data_df[_data_df["date"] == last_date].set_index("branch_id")["balance"]
    _current_balances = last_balances.to_dict()

    print(f"[startup] {len(_branches_df)} ta filial, oxirgi sana: {last_date.date()}")
    yield
    print("[shutdown] Tugadi")


app = FastAPI(
    title="Bank Cash Forecast API",
    description="AI orqali kassa qoldiqlarini bashorat qilish va inkassatsiya optimizatsiyasi",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS - frontend bilan ulanish uchun
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============ Endpoints ============


@app.get("/health", response_model=HealthResponse)
def health():
    """Server ishlayotganini tekshirish."""
    return HealthResponse(
        status="ok",
        model_loaded=predictor.loaded,
    )


@app.get("/api/branches", response_model=BranchesResponse)
def get_branches():
    """Barcha filiallar ro'yxati."""
    branches = []
    for _, row in _branches_df.iterrows():
        branches.append(Branch(
            branch_id=int(row["branch_id"]),
            name=row["name"],
            city=row["city"],
            current_balance=int(_current_balances.get(int(row["branch_id"]), 0)),
        ))
    return BranchesResponse(branches=branches)


@app.get("/api/forecast/{branch_id}", response_model=ForecastResponse)
def get_forecast(
    branch_id: int,
    days: int = Query(7, ge=1, le=30),
):
    """Bitta filial uchun forecast."""
    branch_row = _branches_df[_branches_df["branch_id"] == branch_id]
    if branch_row.empty:
        raise HTTPException(status_code=404, detail=f"Filial topilmadi: branch_id={branch_id}")

    try:
        forecast_df = predictor.forecast(branch_id, days=days)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    forecast_days = []
    for _, row in forecast_df.iterrows():
        forecast_days.append(ForecastDay(
            date=row["ds"].date(),
            predicted_cash=int(row["yhat"]),
            lower_bound=int(row["yhat_lower"]),
            upper_bound=int(row["yhat_upper"]),
            is_payday=bool(row["is_payday"]),
            is_pre_holiday=bool(row["is_pre_holiday"]),
        ))

    return ForecastResponse(
        branch_id=branch_id,
        branch_name=branch_row.iloc[0]["name"],
        model_used="prophet",
        forecast=forecast_days,
        metrics=predictor.get_metrics(branch_id),
    )


@app.get("/api/recommendations/{branch_id}", response_model=RecommendationsResponse)
def get_recommendations(
    branch_id: int,
    days: int = Query(7, ge=1, le=30),
):
    """Inkassatsiya tavsiyalari."""
    branch_row = _branches_df[_branches_df["branch_id"] == branch_id]
    if branch_row.empty:
        raise HTTPException(status_code=404, detail=f"Filial topilmadi: branch_id={branch_id}")

    base_balance = int(branch_row.iloc[0]["base_balance"])
    min_safe, max_safe = get_safe_bounds(base_balance)

    forecast_df = predictor.forecast(branch_id, days=days)
    current_balance = _current_balances.get(branch_id, base_balance)

    recs = make_recommendations(forecast_df, base_balance, current_balance)

    return RecommendationsResponse(
        branch_id=branch_id,
        min_safe_balance=min_safe,
        max_safe_balance=max_safe,
        recommendations=[Recommendation(**r) for r in recs],
    )


@app.get("/api/anomalies", response_model=AnomaliesResponse)
def get_anomalies(branch_id: int = Query(None)):
    """Anomaliyalar ro'yxati.

    Agar branch_id berilmasa - barcha filiallar bo'yicha tekshiradi.
    """
    branches_to_check = [branch_id] if branch_id else _branches_df["branch_id"].tolist()
    anomalies = []

    for bid in branches_to_check:
        branch_row = _branches_df[_branches_df["branch_id"] == bid]
        if branch_row.empty:
            continue

        actual = _current_balances.get(int(bid))
        if actual is None:
            continue

        forecast_df = predictor.forecast(int(bid), days=1)
        detected = detect_anomalies(actual, forecast_df)

        for a in detected:
            anomalies.append(Anomaly(
                branch_id=int(bid),
                branch_name=branch_row.iloc[0]["name"],
                **a,
            ))

    return AnomaliesResponse(anomalies=anomalies)


@app.get("/api/dashboard/summary", response_model=DashboardSummary)
def dashboard_summary():
    """Bosh sahifa uchun umumiy ma'lumot."""
    total_balance = sum(_current_balances.values())
    total_branches = len(_branches_df)

    branches_at_risk = 0
    next_24h_inflow = 0
    next_24h_outflow = 0
    top_alerts = []

    for _, row in _branches_df.iterrows():
        bid = int(row["branch_id"])
        base_balance = int(row["base_balance"])
        min_safe, max_safe = get_safe_bounds(base_balance)
        current = _current_balances.get(bid, 0)

        try:
            forecast_df = predictor.forecast(bid, days=1)
            tomorrow_pred = forecast_df.iloc[0]["yhat"]
            change = tomorrow_pred - current

            if change > 0:
                next_24h_inflow += change
            else:
                next_24h_outflow += abs(change)

            # Risk: ertaga shortage yoki excess
            if tomorrow_pred < min_safe:
                branches_at_risk += 1
                if len(top_alerts) < 5:
                    top_alerts.append(TopAlert(
                        branch_id=bid,
                        type="shortage_risk",
                        message=f"{row['name']}: 24 soat ichida shortage xavfi",
                    ))
            elif tomorrow_pred > max_safe:
                branches_at_risk += 1
                if len(top_alerts) < 5:
                    top_alerts.append(TopAlert(
                        branch_id=bid,
                        type="excess_cash",
                        message=f"{row['name']}: excess cash kutilmoqda",
                    ))
        except Exception as e:
            print(f"[warning] Filial #{bid} uchun forecast xato: {e}")

    # Anomaliya soni
    anomalies_resp = get_anomalies()
    active_anomalies = len(anomalies_resp.anomalies)

    return DashboardSummary(
        total_branches=total_branches,
        total_balance=int(total_balance),
        branches_at_risk=branches_at_risk,
        active_anomalies=active_anomalies,
        next_24h_forecast=Next24hForecast(
            expected_inflow=int(next_24h_inflow),
            expected_outflow=int(next_24h_outflow),
            net_change=int(next_24h_inflow - next_24h_outflow),
        ),
        top_alerts=top_alerts,
    )


@app.get("/api/history/{branch_id}", response_model=HistoryResponse)
def get_history(
    branch_id: int,
    days: int = Query(30, ge=1, le=365),
):
    """Tarixiy balanslar (grafik uchun)."""
    branch_row = _branches_df[_branches_df["branch_id"] == branch_id]
    if branch_row.empty:
        raise HTTPException(status_code=404, detail=f"Filial topilmadi: branch_id={branch_id}")

    branch_data = _data_df[_data_df["branch_id"] == branch_id].sort_values("date")
    history = branch_data.tail(days)

    return HistoryResponse(
        branch_id=branch_id,
        history=[
            HistoryDay(date=row["date"].date(), balance=int(row["balance"]))
            for _, row in history.iterrows()
        ],
    )
