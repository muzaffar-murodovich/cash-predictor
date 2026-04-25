"""
Model wrapper - Prophet modellarini yuklaydi va forecast qiladi.
"""
import pickle
from pathlib import Path

import pandas as pd

MODELS_DIR = Path(__file__).parent.parent / "models"
DATA_DIR = Path(__file__).parent.parent / "data"


class CashPredictor:
    """Prophet modellarini yuklab, forecast qiladigan klass."""

    def __init__(self):
        self.prophet_models = None
        self.metrics = None
        self.loaded = False

    def load(self):
        """Modelni va metrikalarni yuklash."""
        with open(MODELS_DIR / "prophet_models.pkl", "rb") as f:
            self.prophet_models = pickle.load(f)
        self.metrics = pd.read_csv(MODELS_DIR / "prophet_metrics.csv")
        self.loaded = True
        print(f"[predictor] {len(self.prophet_models)} ta Prophet modeli yuklandi")

    def get_metrics(self, branch_id: int) -> dict:
        """Filial uchun metrikalarni qaytarish."""
        row = self.metrics[self.metrics["branch_id"] == branch_id]
        if row.empty:
            return {"mape": 0.0, "rmse": 0.0}
        return {
            "mape": round(float(row.iloc[0]["mape"]), 2),
            "rmse": round(float(row.iloc[0]["rmse_mln"]) * 1_000_000, 0),
        }

    def forecast(self, branch_id: int, days: int = 7) -> pd.DataFrame:
        """Bitta filial uchun forecast.

        Returns:
            DataFrame: ds, yhat, yhat_lower, yhat_upper, is_payday, is_pre_holiday
        """
        if not self.loaded:
            raise RuntimeError("Model yuklanmagan. avval .load() chaqiring")
        if branch_id not in self.prophet_models:
            raise ValueError(f"Filial topilmadi: branch_id={branch_id}")

        model = self.prophet_models[branch_id]

        # Oxirgi train sanani topish (model tarixidan)
        last_date = model.history["ds"].max()

        # Kelajak yaratish (faqat ish kunlari)
        future_dates = pd.bdate_range(start=last_date + pd.Timedelta(days=1), periods=days + 5)
        history_dates = pd.bdate_range(end=last_date, periods=500)
        all_dates = (
            pd.DatetimeIndex(list(history_dates) + list(future_dates))
            .drop_duplicates()
            .sort_values()
        )
        future = pd.DataFrame({"ds": all_dates})

        # Regressor
        future["is_payday"] = (
            future["ds"].dt.day.isin(list(range(1, 6)) + list(range(25, 31))).astype(int)
        )

        # Predict
        forecast = model.predict(future)

        # Faqat kelajak kunlari
        result = forecast[forecast["ds"] > last_date].head(days).copy()

        # Pre-holiday flag (frontend uchun)
        from .optimizer import is_pre_holiday
        result["is_pre_holiday"] = result["ds"].apply(is_pre_holiday).astype(int)

        return result[["ds", "yhat", "yhat_lower", "yhat_upper", "is_payday", "is_pre_holiday"]]


# Global instance (FastAPI startup'da yuklanadi)
predictor = CashPredictor()


def load_branches() -> pd.DataFrame:
    """Filiallar ma'lumotini yuklash."""
    return pd.read_csv(DATA_DIR / "branches.csv")


def load_synthetic_data() -> pd.DataFrame:
    """Sintetik datani yuklash (history endpoint uchun)."""
    return pd.read_csv(DATA_DIR / "synthetic_data.csv", parse_dates=["date"])
