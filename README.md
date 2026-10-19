# Credit Risk & Loan Default Early Warning System

A fullstack AI-powered credit risk assessment system built with **FastAPI** (Python backend) and a **vanilla JS** SPA frontend.

## 🚀 Features

- 🤖 **ML Risk Scoring** — Multi-factor weighted model (credit score, DTI, payment history, employment, loan burden, age)
- 🔍 **Explainable AI** — See exactly which factors drove the risk score
- 📊 **Live Dashboard** — Risk distribution charts, score histograms, portfolio trends
- 🔬 **What-If Simulator** — Adjust parameters and predict how risk changes
- 🔔 **Risk Alerts** — Customers flagged for High/Critical risk
- 📄 **Report Export** — Download PDF or CSV risk reports
- 🔐 **Auth** — Simple session-based login (demo: `admin` / `admin`)

## 🗂️ Project Structure

```
├── main.py              # FastAPI server
├── engine.py            # Risk calculation engine
├── requirements.txt     # Python dependencies
├── index.html           # SPA frontend shell
├── css/styles.css       # Styles
├── js/
│   ├── auth.js          # Login/session management
│   ├── ml-engine.js     # API client (RiskEngine)
│   ├── dashboard.js     # Chart rendering
│   ├── app.js           # Main app controller
│   └── report.js        # PDF/CSV export
├── data/
│   └── sample-data.csv  # 25-customer demo dataset
└── img/
    └── abstract_finance_bg.png
```

## ⚙️ Setup & Run

### Prerequisites
- Python 3.9+

### Install & Start

```bash
pip install -r requirements.txt
python main.py
```

Then open **http://localhost:8000** in your browser.

### Login
- **Username:** `admin`
- **Password:** `admin`

## 📋 CSV Format

Upload your own customer data with these columns:

| Column | Type | Example |
|---|---|---|
| customer_id | String | C001 |
| name | String | Rajesh Kumar |
| age | Number | 35 |
| income | Number | 85000 |
| loan_amount | Number | 500000 |
| emi | Number | 12500 |
| credit_score | Number (300–850) | 750 |
| missed_payments | Number | 0 |
| employment_years | Number | 8 |
| existing_loans | Number | 1 |
| loan_tenure_months | Number | 48 |
| collateral_value | Number | 600000 |
| loan_purpose | String | Home Renovation |

## 🧮 Risk Model Weights

| Factor | Weight |
|---|---|
| Credit Score | 25% |
| Debt-to-Income Ratio | 20% |
| Payment History | 20% |
| Employment Stability | 10% |
| Loan-to-Income Ratio | 10% |
| Existing Loan Burden | 10% |
| Age Risk Factor | 5% |

## 📊 Risk Levels

| Level | Score Range | Action |
|---|---|---|
| ✅ Low | 0–25 | Standard monitoring |
| ⚠️ Medium | 26–50 | Enhanced monitoring |
| 🔶 High | 51–75 | Immediate review |
| 🔴 Critical | 76–100 | Freeze & recover |
