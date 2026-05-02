# Implementation Plan: Omnivax MaaS Platform Evolution

This plan outlines the architectural transformation of the Plant Disease Omnivax from a standalone tool into a **Model-as-a-Service (MaaS)** ecosystem.

## Goal
To build a scalable platform where farmers use models (Standard), developers contribute and manage models (Developer), and organizations gain deep insights (Enterprise), all secured by Supabase.

## Architecture & Tech Stack
- **Frontend**: Next.js 14, Tailwind CSS, Supabase Client SDK.
- **Backend**: FastAPI, SQLAlchemy (SQLite/PostgreSQL), Supabase Auth verification.
- **Authentication**: Supabase (Email, Google, GitHub OAuth).
- **Inference**: EfficientNet (PyTorch).

---

## Phase 1: Authentication Migration (Supabase)
**Objective**: Replace custom JWT/Bcrypt logic with Supabase Auth for enterprise security.

1. **Supabase Provisioning**: Configure project, OAuth providers, and SMTP.
2. **Backend Security**: Implement a new dependency `get_supabase_user` that validates the Bearer token against Supabase's public keys.
3. **Frontend Refactor**: 
    - Replace the `/login` and `/join-pilot` custom logic with Supabase `auth.signInWithPassword` and `auth.signUp`.
    - Implement the `AuthObserver` to manage sessions globally.

## Phase 2: Role-Based Access Control (RBAC)
**Objective**: Partition the platform features based on user tiers.

1. **Schema Expansion**: Update the database to include user roles and permissions.
2. **Middle-Layer Enforcement**: 
    - Create a role-based guard for API endpoints.
    - Standard Users: Access to Prediction and Chat.
    - Developers: Access to Model Registry and Uploads.
    - Enterprise: Access to advanced Analytics.

## Phase 3: Developer Model Management (UI & CLI)
**Objective**: Enable a community of developers to improve the platform's diagnostic capabilities.

1. **Model Submission Pipeline**:
    - **UI**: A drag-and-drop interface for model metadata and `.pth` weight files.
    - **CLI**: A Python package `omnivax-cli` for terminal-based uploads.
2. **Registry Status**: Models move from `pending` -> `verified` after verification.

## Phase 4: Enterprise Analytics & Scalability
**Objective**: Provide business intelligence for large-scale operations.

1. **Telemetry**: Log inference data (accuracy trends, model performance).
2. **Dashboard**: Build a high-performance analytics view for Enterprise users.

---

## Success Metrics
- **Authentication Reliability**: 100% success rate for OAuth logins.
- **Developer Engagement**: Ability to upload a model via CLI in under 3 commands.
- **System Integrity**: Validated RBAC preventing unauthorized model modifications.
