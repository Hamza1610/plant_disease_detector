# Omnivax: Current Implementation & Architectural Foundation

## 1. Project Vision
Omnivax is a professional-grade **Plant Disease Intelligence Platform** (Model-as-a-Service). It provides a unified ecosystem for standard users (diagnostics), developers (model integration), and enterprise partners (regional health analytics).

---

## 2. System Architecture Overview

### A. Backend Core (FastAPI)
- **Framework**: Python FastAPI for high-performance, asynchronous API delivery.
- **Database Layer**: SQLAlchemy ORM connected to Supabase (PostgreSQL).
- **Authentication**: 
    - **Primary**: Supabase JWT (RS256) for web session security.
    - **Service-Level**: Custom Hashed API Key system (SHA-256) for CLI and automation.
- **Inference Engine**: Adapter-based architecture to support multiple AI models (EfficientNet, GenAI).

### B. Frontend Architecture (Next.js)
- **Framework**: Next.js 14+ with App Router.
- **Security**: Integration with Supabase Auth (hooks/middleware).
- **UI System**: Vanilla CSS with glassmorphic aesthetics, Lucide-React for iconography.
- **State Management**: React Hooks (useUser, useAnalytics) for live data synchronization.

### C. Developer Ecosystem (CLI)
- **Library**: `typer` and `rich` for a professional terminal experience.
- **Connectivity**: `httpx` for authenticated communication with the backend.
- **Config**: Local XDG-compliant storage for session and API key management.

---

## 3. Component-Level Audit

### 🔐 Identity & Access Management (IAM)
- **Implementation**: 
    - `get_current_user` dependency handles both `Authorization` (JWT) and `X-API-Key` headers.
    - **Roles**: `STANDARD`, `DEVELOPER`, `ENTERPRISE`.
    - **API Keys**: Stored as cryptographic hashes. UI-only creation flow (Standardized).
- **Current State**: Backend logic is implemented; UI Management Table is in the "Design" phase.

### 🧠 Intelligence & Diagnostics
- **Implementation**: `/predict` endpoint accepts multipart image uploads and model identifiers.
- **MLOps**: 
    - `ModelCatalog` database tracks artifacts, versioning, and ownership.
    - `/models/upload` handles multi-part model weight uploads.
- **Registry**: Seeded with `efficientnet_b0_v1` as the platform's foundation.

### 📊 Analytics & Reporting
- **Enterprise Router**: Provides global statistics, detection trends, and pathogen performance.
- **Developer Metrics**: Tracking model usage, error rates, and latency (Backend infrastructure ready).

---

## 4. Security & Reliability Audit
- **Testing**: `pytest` suite implemented in `backend/tests/`. Includes mocked inference to test API logic without GPU overhead.
- **Password Security**: Bcrypt hashing (71-byte safety truncation implemented).
- **Key Security**: Prefixed key identification (`omni_...`) for user visibility without exposing the full hash.

---

## 5. The "New Vision" (Architectural Evolution)
Based on the **IAM Authorization Framework**, the system is moving toward:
1.  **Granular Permissions**: Shifting from "Roles" to "Ability-based" guards (e.g., `PERMISSION_USE_CLI`).
2.  **UI-First Security**: Centralizing all security writes (key creation/revocation) to the Web Dashboard.
3.  **CLI Onboarding**: Treating the CLI as a product with a "Quick Start" guide in the Developer Hub.
4.  **System-wide Standardization**: Ensuring that metrics, security, and UI follow a single consistent design language.

---

## 6. File Inventory (Critical Paths)
- **Backend Entry**: `backend/app/main.py`
- **IAM Logic**: `backend/app/api/auth.py`
- **DB Models**: `backend/app/db/models.py`
- **Predict API**: `backend/app/api/predict.py`
- **CLI Entry**: `cli/omnivax_cli.py`
- **Test Suite**: `backend/tests/`

---
**Document Status**: *Finalized Ground-Level Documentation*
**Version**: 2.1.0
