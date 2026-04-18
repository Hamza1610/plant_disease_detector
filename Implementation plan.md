# Tiki Tice Omniverse - Full Implementation Plan (Model-First)

## 1) Product vision

Build a full-scale Plant Disease AI platform where users discover, compare, and use many models from one place.  
This is **model-first** and **tag/search-driven**, not task-first.

Core user experience:
- users search by plant, disease, symptom, or model tag
- users open a model page, see benchmark + development details
- users run prediction immediately from the same page
- users can choose free or premium models as platform scales

## 2) Strategic product direction

The platform is both:
- a SaaS product for plant health inference
- a research repository with model cards, benchmark history, and version traceability

Initial model:
- `efficientnet_b0_v1` from `best_efficientnet.pth`

Future model categories:
- leaf disease classifiers
- soil-related classifiers
- pest-related models
- segmentation/detection models
- multimodal agronomy models

## 3) Confirmed technical baseline from existing artifacts

From `classification-finalproject.ipynb` and `best_efficientnet.pth`:
- architecture: EfficientNet-B0
- output classes: 14
- image input: `224x224`
- normalization mean: `[0.485, 0.456, 0.406]`
- normalization std: `[0.229, 0.224, 0.225]`
- checkpoint format: state dict (`OrderedDict`)
- class order must be locked in metadata to avoid inference label drift

## 4) Functional requirements (model-first)

1. Landing and discovery
- modern animated homepage
- quick search bar ("tomato", "leaf blight", "rust", etc.)
- featured and trending models

2. Model catalog
- browse all models
- filter by tags, plants, diseases, modality, framework, status, pricing tier
- sort by accuracy, latency, popularity, date

3. Model details page (critical)
- what model predicts
- supported plants/diseases
- benchmark table and charts
- training/development notes
- limitations and safe-use guidance
- version history and changelog
- run prediction action

4. Prediction workspace
- upload input (image now; extensible later)
- choose model directly
- receive top-k predictions + confidence + response metadata

5. Benchmark and evaluation center
- benchmark runs per model and per dataset
- compare selected models side-by-side
- keep historical benchmark records

6. Monetization-ready behavior
- model tiers (`free`, `pro`, `enterprise`)
- usage quotas and optional paywall integration path

## 5) Non-functional requirements

- Scalability: model registry handles many models and versions
- Reliability: strict validation and deterministic preprocessing
- Reproducibility: benchmark and model metadata fully traceable
- Performance: low latency and clear SLA targets per tier
- Maintainability: modular backend + adapter pattern
- Product quality: responsive colorful UI and clear UX states

## 6) Architecture overview

Three core layers:

1. Frontend (HTML/CSS/JS)
- landing, catalog, model detail, prediction studio, benchmark center

2. Backend (FastAPI)
- registry APIs, model search APIs, prediction APIs, benchmark APIs, billing-ready hooks

3. Model and research layer
- artifacts, metadata, model cards, benchmark runs, evaluation reports

## 7) Metadata and registry design (replace task model)

Use **model-centric metadata** with tags and capabilities.

Main registry files:
- `models/metadata/models.json` (primary model index)
- `models/metadata/tags.json` (controlled vocabulary)
- `models/metadata/benchmarks.json` (latest summaries)
- `models/metadata/pricing_tiers.json` (free/pro/enterprise policies)

Per model file:
- `models/metadata/model_<model_id>.json`

Required model metadata schema:
- `model_id`, `name`, `version`, `status`
- `description`, `owner`, `created_at`
- `artifact_path`, `framework`, `runtime`
- `input_spec`, `output_spec`
- `class_names`, `class_to_idx`, `preprocess`
- `supported_plants`, `supported_diseases`
- `tags` (array: e.g. `["tomato","leaf","fungal","classification"]`)
- `benchmark_summary`
- `limitations`, `safety_notes`
- `pricing_tier`, `quota_policy`

## 8) Backend API design (updated endpoint groups)

1. System
- `GET /health`
- `GET /info`

2. Model catalog and search
- `GET /models`
- `GET /models/{model_id}`
- `GET /models/search?q=...`
- `GET /models/filter?tags=...&plant=...&disease=...&tier=...`
- `GET /models/tags`

3. Predictions
- `POST /predict` (single input + selected `model_id`)
- `POST /predict/batch`
- `GET /predict/history` (optional phase 2)

4. Benchmarks
- `POST /benchmarks/run`
- `GET /benchmarks`
- `GET /benchmarks/{run_id}`
- `GET /benchmarks/compare?model_ids=...`

5. Model management (internal/admin)
- `POST /models/register`
- `POST /models/{model_id}/activate`
- `POST /models/{model_id}/archive`
- `PATCH /models/{model_id}/metadata`

6. Monetization-ready endpoints (phase-gated)
- `GET /pricing/tiers`
- `POST /usage/check-access`
- `POST /usage/record`

## 9) Backend module structure

`backend/app/`
- `main.py` (startup, middleware, routers)
- `api/` (`system.py`, `models.py`, `predict.py`, `benchmarks.py`, `billing.py`)
- `core/` (settings, logging, exceptions)
- `registry/` (registry loaders, validators, search index)
- `inference/` (base adapter + model implementations)
- `services/` (catalog, prediction, benchmark, access control)
- `schemas/` (Pydantic request/response contracts)

## 10) Inference subsystem plan

Adapter interface:
- `load()`
- `validate_input()`
- `preprocess()`
- `infer()`
- `postprocess()`
- `healthcheck()`

Initial adapter:
- `EfficientNetB0Adapter` for `efficientnet_b0_v1`

Inference safeguards:
- assert output dimension equals metadata class count
- enforce exact class order from metadata
- version-lock preprocessing spec

## 11) Frontend information architecture

Primary pages:
- Landing (`/`)
- Explore Models (`/models`)
- Model Detail (`/models/{model_id}`)
- Predict Studio (`/predict`)
- Benchmarks (`/benchmarks`)
- Docs/About (`/about`)

Core UX features:
- universal search box
- tag chips and filters
- model comparison drawer
- animated confidence bars on predictions
- benchmark charts and trend cards

Visual system:
- modern colorful gradients, smooth transitions, responsive layout

## 12) Repository structure (updated)

```text
plant_disease_detector/
  backend/
    app/
      api/
      core/
      inference/
      registry/
      schemas/
      services/
      main.py
    tests/
    requirements.txt
  frontend/
    index.html
    assets/
      css/
      js/
      images/
    views/
      landing/
      models/
      predict/
      benchmarks/
      about/
  models/
    artifacts/
      best_efficientnet.pth
    metadata/
      models.json
      tags.json
      benchmarks.json
      pricing_tiers.json
      model_efficientnet_b0_v1.json
  benchmarks/
    datasets/
    runs/
    reports/
  docs/
    architecture.md
    api.md
    model-cards/
  scripts/
  .env.example
  README.md
```

## 13) Benchmark and research framework

Benchmark scope per model:
- quality metrics: accuracy, precision, recall, f1
- operational metrics: p50/p95 latency, throughput
- artifact stats: model size, load time

Persistence:
- run metadata and metric snapshots in JSON/CSV
- optional SQLite upgrade after v1

Research outputs:
- model card for every model version
- benchmark report and changelog
- dataset notes and reproducibility notes

## 14) Monetization and scale path

Phase 1:
- all models free, but metadata includes tier fields

Phase 2:
- enforce tier checks on selected endpoints
- quota and usage tracking

Phase 3:
- payment integration and premium model access control

Design rule:
- pricing/access logic stays in service layer; inference adapters remain clean

## 15) Detailed implementation phases

### Phase 0 - Contract finalization
- freeze model metadata schema
- freeze API contracts for catalog/search/predict/benchmarks
- define tag taxonomy and naming conventions

### Phase 1 - Platform scaffold
- create backend/frontend/models/benchmarks/docs skeleton
- set up FastAPI app + static frontend app shell
- add environment management and logging

### Phase 2 - First model integration
- add `model_efficientnet_b0_v1.json`
- implement EfficientNet adapter and load `best_efficientnet.pth`
- add inference sanity checks

### Phase 3 - Core APIs
- implement model catalog/search endpoints
- implement `/predict` and `/predict/batch`
- implement benchmark run/list/compare endpoints

### Phase 4 - Product UI
- build landing page
- build model catalog with tag filters and search
- build model details page with benchmark and development info
- build prediction studio connected to backend

### Phase 5 - Benchmark center and reports
- benchmark runner service and persistence
- benchmark comparison UI and model scorecards
- generate model card stubs automatically from metadata

### Phase 6 - Hardening and release prep
- tests (unit + API + regression)
- security validation on uploads and metadata access
- performance checks and caching opportunities
- documentation and onboarding guides

## 16) Testing plan

Unit tests:
- registry parsing and validation
- search/filter behavior by tags/plants/diseases
- class index consistency and preprocess validation

API tests:
- `/models`, `/models/search`, `/predict`, `/benchmarks/*`
- invalid model id, invalid file type, invalid filter values

Regression tests:
- fixed sample images -> stable top-k format
- confidence and label ordering checks

Frontend checks:
- search and filter behavior
- model detail rendering
- prediction flow and error states

## 17) Risks and mitigation

1. Metadata drift across models
- mitigate with schema validator and CI checks

2. Wrong class mapping at inference
- mitigate with startup assertions and smoke tests

3. Benchmark inconsistency
- mitigate with fixed manifests and run metadata lock

4. Growth complexity with many models
- mitigate with strict model registry contracts and adapter boundaries

## 18) Milestones and acceptance criteria

Milestone 1: Searchable model platform foundation
- catalog endpoint and frontend model list live
- tag search returns correct models

Milestone 2: First live prediction model
- `efficientnet_b0_v1` predicts correctly through API and UI

Milestone 3: Model detail and benchmark visibility
- each model page shows benchmark + development info

Milestone 4: Benchmark engine baseline
- benchmark run/compare working and persisted

Milestone 5: Monetization-ready architecture
- tier fields, access checks, and usage hooks integrated (even if free mode remains default)

## 19) Immediate next step after approval

Start implementation in this order:
1. scaffold repository and module layout
2. create model-centric metadata contracts and seed files
3. implement EfficientNet adapter + `/predict`
4. implement `/models` + `/models/search` + tag filtering
5. build landing, model catalog, model detail, and predict pages
6. implement benchmark run/list/compare foundation

This sequence delivers a usable model marketplace-like plant AI platform quickly while staying ready for many future models and paid tiers.
