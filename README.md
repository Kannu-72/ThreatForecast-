# PREVENT-X Production Package

Defensive production prototype for the frozen PREVENT-X forecasting architecture.

```text
network packets
	-> genuine 10-second state
	-> 45 features
	-> five-state (50-second) history
	-> Transformer
	-> six direct risk forecasts (+10 to +60 seconds)
	-> threshold 0.05
	-> dashboard, SHAP explanations, and MITRE ATT&CK context
```

## Requirements

- Python 3.10 or newer
- Node.js 18 or newer and npm
- Packet-capture permissions for live capture mode
- The four model artifacts listed below

The package does not include Kaggle datasets or training arrays.

## Quick start

### 1. Install model artifacts

Place these files in `artifacts/`:

```text
prevent_x_transformer_best.pt
prevent_x_training_scaler.joblib
prevent_x_transformer_architecture.json
prevent_x_operational_threshold.json
```

### 2. Start the backend

From the repository root:

```bash
python -m venv .venv
# Windows PowerShell: .\.venv\Scripts\Activate.ps1
# Windows cmd:        .venv\Scripts\activate.bat
# macOS/Linux:        source .venv/bin/activate
python -m pip install -r backend/requirements.txt
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
```

The API and interactive documentation are available at:

- API: <http://127.0.0.1:8000>
- Docs: <http://127.0.0.1:8000/docs>

### 3. Start the frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite, usually <http://localhost:5173>.

## Docker

The backend can also be started with Docker Compose:

```bash
docker compose up --build
```

This exposes the API on port `8000` and mounts `artifacts/` and `data/` into the container. Start the frontend separately with the commands above.

## Dashboard data sources

The dashboard supports three operating modes:

1. **Live capture**: read packets from an authorized local network interface.
2. **Controlled lab traffic**: generate traffic for an isolated demonstration environment.
3. **PCAP replay**: upload a `.pcap`, `.pcapng`, or `.cap` file from the browser.

For PCAP replay, the backend stores a temporary copy in `backend/runtime/uploads/` and starts replay automatically.

## MITRE ATT&CK context

A built-in contextual catalog is included. To download the current Enterprise STIX 2.1 bundle:

```bash
python scripts/download_mitre.py
```

The bundle is saved as `data/mitre/enterprise-attack.json` and parsed by the MITRE service.

## Explainability

The `/api/explain` endpoint calculates on-demand SHAP permutation-style explanations over the 225 sequence positions: five states multiplied by 45 features. It then aggregates the results back to the frozen 45-feature contract. Explanation requests are more expensive than inference.

## Runtime behavior

- Forecasting starts only after five genuine occupied 10-second states exist.
- The state engine never invents empty states to fill missing intervals.
- Forecast outputs are **risk scores**, not calibrated probabilities.
- The production model is the original direct multi-horizon Transformer. The residual Transformer was an evaluation experiment and is not used here.

For deterministic demonstrations, use an isolated lab or replayed PCAP. Run all capture and replay workflows only in environments where you have authorization.
