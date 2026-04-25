# Bank Cash Forecast — ML Module

Bank kassa qoldiqlarini AI orqali boshqarish tizimi.
Time-series forecasting + Inkassatsiya optimizatsiyasi + REST API.

## Texnologiyalar

- **Forecasting:** Prophet (Meta) + LSTM (PyTorch)
- **API:** FastAPI
- **Optimization:** Custom rule-based + Linear logic

## Loyiha strukturasi

```
cash_forecast/
├── data/                 # Sintetik dataset
├── notebooks/            # EDA va modellashtirish
├── models/               # Saqlangan modellar
├── api/                  # FastAPI server
├── requirements.txt
└── README.md
```

## Setup (lokal, macOS M-series)

```bash
# 1. Virtual muhit yaratish (uv variant)
uv venv
source .venv/bin/activate

# 2. Paketlarni o'rnatish
uv pip install -r requirements.txt

# 3. Jupyter kernel ro'yxatga olish
python -m ipykernel install --user --name cash-forecast --display-name "Cash Forecast"
```

## Ishga tushirish ketma-ketligi

1. `notebooks/01_generate_data.ipynb` — sintetik data yaratish
2. `notebooks/02_eda.ipynb` — tahlil
3. `notebooks/03_prophet_model.ipynb` — Prophet model
4. `notebooks/04_lstm_model.ipynb` — LSTM model
5. `cd api && uvicorn main:app --reload` — API serverini ishga tushirish

## API endpoint'lar

To'liq spetsifikatsiya: [API_SPEC.md](./API_SPEC.md)

API ishga tushgandan so'ng: http://localhost:8000/docs (Swagger UI)
