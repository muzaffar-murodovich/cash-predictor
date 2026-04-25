"""
Optimization layer - forecast'dan inkassatsiya tavsiyalariga aylantirish.

Mantiq:
- Min safe balance = base_balance * 0.4
- Max safe balance = base_balance * 1.5
- Agar forecast < min_safe -> deliver (yetkazib berish)
- Agar forecast > max_safe -> collect (yig'ib olish)
- Aks holda - none
"""
from datetime import date, datetime, timedelta

import pandas as pd

# O'zbekiston bayramlari
UZBEK_HOLIDAYS = {
    "2024-01-01", "2024-03-08", "2024-03-21", "2024-04-10",
    "2024-05-09", "2024-06-17", "2024-09-01", "2024-10-01", "2024-12-08",
    "2025-01-01", "2025-03-08", "2025-03-21", "2025-03-31",
    "2025-05-09", "2025-06-07", "2025-09-01", "2025-10-01", "2025-12-08",
    "2026-01-01", "2026-03-08", "2026-03-20", "2026-03-21",
    "2026-05-09", "2026-05-27",
}
HOLIDAYS_DT = {pd.to_datetime(d) for d in UZBEK_HOLIDAYS}


def is_pre_holiday(d) -> bool:
    """Sana bayram oldi 1-2 kun ekanligini tekshirish."""
    if isinstance(d, str):
        d = pd.to_datetime(d)
    elif not isinstance(d, pd.Timestamp):
        d = pd.to_datetime(d)
    for offset in [1, 2]:
        if (d + pd.Timedelta(days=offset)) in HOLIDAYS_DT:
            return True
    return False


def get_safe_bounds(base_balance: int) -> tuple[int, int]:
    """Filial uchun xavfsiz min/max chegaralari.

    Args:
        base_balance: filialning bazaviy balansi

    Returns:
        (min_safe, max_safe)
    """
    min_safe = int(base_balance * 0.4)
    max_safe = int(base_balance * 1.5)
    return min_safe, max_safe


def make_recommendations(
    forecast_df: pd.DataFrame,
    base_balance: int,
    current_balance: int = None,
) -> list[dict]:
    """Forecast asosida inkassatsiya tavsiyalarini yaratish.

    Args:
        forecast_df: ds, yhat, yhat_lower, yhat_upper ustunlari bilan
        base_balance: filial bazaviy balansi
        current_balance: hozirgi balans (ixtiyoriy, ko'rsatish uchun)

    Returns:
        Tavsiyalar ro'yxati
    """
    min_safe, max_safe = get_safe_bounds(base_balance)
    recommendations = []

    for _, row in forecast_df.iterrows():
        d = row["ds"]
        predicted = row["yhat"]
        lower = row["yhat_lower"]
        upper = row["yhat_upper"]
        is_payday = bool(row.get("is_payday", 0))
        is_pre_hol = bool(row.get("is_pre_holiday", 0))

        action = "none"
        amount = 0
        reason = "Balans normal chegaralarda"
        priority = "low"

        # Shortage xavfi (lower bound min_safe dan past)
        if lower < min_safe:
            action = "deliver"
            shortage = min_safe - predicted
            # Agar ish haqi yoki bayram oldi - ko'proq olib kelish
            multiplier = 1.5 if (is_payday or is_pre_hol) else 1.2
            amount = max(int(shortage * multiplier), int(base_balance * 0.1))
            priority = "high" if lower < min_safe * 0.7 else "medium"

            if is_payday:
                reason = "Ish haqi kuni, kutilayotgan oqim yuqori - shortage xavfi"
            elif is_pre_hol:
                reason = "Bayram oldi - mijozlar pul tortib oladi, shortage xavfi"
            else:
                reason = "Forecast min xavfsiz chegaradan past - shortage xavfi"

        # Excess cash (upper bound max_safe dan yuqori)
        elif upper > max_safe:
            action = "collect"
            excess = predicted - max_safe
            amount = max(int(excess * 0.8), int(base_balance * 0.1))
            priority = "medium" if upper > max_safe * 1.2 else "low"
            reason = "Excess cash kutilmoqda - likvidlik yo'qotishi xavfi"

        recommendations.append({
            "date": d.date() if isinstance(d, pd.Timestamp) else d,
            "action": action,
            "amount": amount,
            "reason": reason,
            "priority": priority,
        })

    return recommendations


def detect_anomalies(
    actual_balance: int,
    forecast_df: pd.DataFrame,
    threshold: float = 0.25,
) -> list[dict]:
    """Hozirgi balans forecastdan ko'p og'ishganligini tekshirish.

    Args:
        actual_balance: hozirgi haqiqiy balans
        forecast_df: forecast (yhat ustun bilan)
        threshold: og'ish chegarasi (0.25 = 25%)

    Returns:
        Anomaliyalar ro'yxati (bo'sh bo'lsa - hammasi normal)
    """
    if forecast_df.empty:
        return []

    expected = forecast_df.iloc[0]["yhat"]
    deviation = (actual_balance - expected) / expected
    deviation_pct = abs(deviation) * 100

    if abs(deviation) < threshold:
        return []

    if abs(deviation) > 0.5:
        severity = "critical"
    elif abs(deviation) > threshold:
        severity = "warning"
    else:
        severity = "info"

    direction = "yuqori" if deviation > 0 else "past"

    return [{
        "date": forecast_df.iloc[0]["ds"].date() if hasattr(forecast_df.iloc[0]["ds"], "date") else forecast_df.iloc[0]["ds"],
        "actual_balance": int(actual_balance),
        "expected_balance": int(expected),
        "deviation_percent": round(deviation_pct, 1),
        "severity": severity,
        "message": f"Kutilmagan {direction} qoldiq aniqlandi ({deviation_pct:.1f}% og'ish)",
    }]
