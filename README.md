# Tiki Tice Omniverse

Model-first plant disease AI platform with searchable model catalog, prediction API, and benchmark-ready metadata.

## Live setup (generic)

### 1) Create and activate virtual environment

From project root (`plant_disease_detector`):

```bash
python -m venv .venv
```

Activate virtual environment:

```bash
# macOS/Linux
source .venv/bin/activate

# Windows (cmd)
.venv\Scripts\activate.bat

# Windows (PowerShell)
.venv\Scripts\Activate.ps1
```

Upgrade pip:

```bash
python -m pip install --upgrade pip
```

### 2) Install backend dependencies

```bash
cd backend
pip install -r requirements.txt
cd ..
```

### 3) Run FastAPI server (backend + frontend pages)

```bash
cd backend
uvicorn app.main:app --reload
```

Platform will run at:
- `http://127.0.0.1:8000`

Pages:
- `/` landing page
- `/app/models` model marketplace
- `/app/models/<model_id>` model detail
- `/app/predict` prediction studio
- `/app/benchmarks` benchmark center
- `/app/pricing` pricing page

### 4) Deactivate virtual environment when done

```bash
deactivate
```

## Quick verify checklist

- `GET /health` returns `{ "status": "ok" }`
- `GET /models` returns model list
- Upload image in `/app/predict` and receive top-k output

## Current v1 model

- `efficientnet_b0_v1` from `models/artifacts/best_efficientnet.pth`
- Corn/Tomato leaf disease classes (14 classes)

## Implemented in this scaffold

- model registry (`models/metadata/*.json`)
- model catalog endpoints (`/models`, `/models/search`, `/models/filter`, `/models/tags`, `/models/{model_id}`)
- model management endpoints (`/models/register`, `/models/{model_id}/activate`, `/models/{model_id}/archive`, `/models/{model_id}/metadata`)
- prediction endpoint (`/predict`) with model selection
- benchmark endpoints (`/benchmarks`, `/benchmarks/run`, `/benchmarks/compare`)
- usage and pricing endpoints (`/usage/pricing`, `/usage/check-access`, `/usage/record`)
- starter multi-section UI for landing, catalog, model detail, prediction, and benchmarks

## Benchmark manifest format

Use `benchmarks/datasets/sample_manifest.json` as reference:
- `dataset_name`: display name
- `entries`: array of objects with:
  - `image_path`: path relative to workspace root
  - `label`: class label string matching model metadata class names
