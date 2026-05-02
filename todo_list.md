# Omnivax Platform Expansion: Master TODO List

This document serves as the source of truth for the transition to a high-performance, MaaS (Model-as-a-Service) platform.

## Phase 1: Authentication Migration (Supabase)
Migrating from custom JWT to Supabase Auth for enterprise security and multi-provider support.

- [x] **Infrastructure Setup**
    - [x] Create Supabase Project and retrieve `URL` and `Anon Key`.
    - [x] Enable Google (Gmail) and GitHub OAuth providers.
    - [x] Configure SMTP for password recovery emails.
- [x] **Backend Integration**
    - [x] Install `python-jose` or `jose` for JWT verification.
    - [x] Update `app/api/auth.py` to verify Supabase JWTs.
    - [x] Implement the `AuthObserver` to manage sessions globally.

## Phase 1.5: Database Migration (PostgreSQL)
**Objective**: Transition from local SQLite to Supabase's managed PostgreSQL.

1. **Connection Refactor**: Update the SQLAlchemy engine to use PostgreSQL driver (`psycopg2`).
2. **Managed Sync**: Implement Postgres Triggers within Supabase to automatically sync new `auth.users` sign-ups into the `public.users` table, ensuring a single source of truth for auth.
3. **Remote Schema**: Deploy the current application schema to the remote Supabase instance.

- [x] **Frontend Integration**
    - [x] Install `@supabase/supabase-js` and `@supabase/auth-helpers-nextjs`.
    - [x] Create `src/lib/supabase.ts` client.
    - [x] Refactor `Login` and `Join Pilot` pages to use Supabase Auth.
    - [x] Implement "Sign in with Google" and "Sign in with GitHub" buttons.
    - [x] Implement Password Recovery flow (Implicitly handled by Supabase UI/Logic).
    - [x] Create OAuth callback handler.

## Phase 1.5: Database Migration (PostgreSQL)
Migrating from local SQLite to Supabase Managed PostgreSQL.

- [x] **Database Connection**
    - [x] Update `DATABASE_URL` in `.env` to Supabase Postgres connection string.
    - [x] Install `psycopg2-binary` in `requirements.txt`.
- [x] **Schema Migration**
    - [x] Run `Base.metadata.create_all()` against the new Postgres instance.
    - [x] Verify `users`, `models`, and `predictions` tables exist in Supabase Public schema.
- [ ] **Auth Synchronization (Postgres Triggers)**
    - [ ] Create a Postgres Function in Supabase to sync `auth.users` to `public.users`.
    - [ ] Create a Trigger to execute the function on `INSERT` to `auth.users`.

## Phase 2: Role-Based Access Control (RBAC)
Implementing Standard, Developer, and Enterprise tiers.

- [x] **Database Schema Update**
    - [x] Add `role` column to `User` table (Enum: `standard`, `developer`, `enterprise`).
- [x] **Backend Permissions**
    - [x] Refactor `get_current_user` to pull `role` from the database.
    - [x] Protect Model Management APIs (Restrict to `DEVELOPER` / `ENTERPRISE`).
    - [x] Implement User-Level data isolation (Users only see their own scans).
- [x] **Frontend UI Customization**
    - [x] Create a `DeveloperDashboard` component.
    - [x] Hide/Show navigation links based on user role.
    - [x] Add "Access Denied" page for unauthorized attempts.

## Phase 3: Developer Model Management
Enabling developers to contribute to the Omnivax ecosystem.

- [x] **Model Upload API**
    - [x] Create endpoint `POST /developer/models` to accept metadata and model artifacts (weights).
    - [x] Implement file storage logic (e.g., local `models/artifacts/` or S3).
- [x] **Approval Workflow**
    - [x] Add `status` (pending, verified, rejected) to `ModelCatalog`.
    - [x] Create an Admin interface (or internal API) to approve/reject models.
- [x] **Developer Dashboard**
    - [x] View status of uploaded models.
    - [x] View basic performance metrics (latency, accuracy).

## Phase 4: Enterprise Analytics & Scaling
Providing deep insights for enterprise-level users.

- [x] **Usage Tracking**
    - [x] Log every prediction request with `user_id`, `model_id`, and `timestamp`.
- [x] **Analytics API**
    - [x] Create endpoints for usage summaries (daily/weekly/monthly).
- [x] **Enterprise Dashboard**
    - [x] Build `/enterprise` dashboard with detection trends and stats.
- [ ] **Priority Queues**
    - [ ] (Optional) Implement priority-based request handling for Enterprise users.

## Phase 5: Developer CLI (Omnivax-CLI)
A command-line tool for professional developer workflows.

- [x] **CLI Development**
    - [x] Implement `omnivax login` command.
    - [x] Implement `omnivax run` command for diagnostics.
    - [x] Implement `omnivax models list` to check model registry.
- [ ] **Distribution**
    - [ ] Create `setup.py` for easy installation.

## Phase 6: Security & Reliability (Advanced)
Hardening the platform and ensuring stable releases.

- [x] **Advanced Security (API Keys)**
    - [x] Create `ApiKey` database model.
    - [x] Implement API Key generation and hashing logic.
    - [x] Support `X-API-Key` header authentication.
- [x] **Automated Testing Suite**
    - [x] Set up `pytest` framework with SQLite in-memory test DB.
    - [x] Implement core authentication tests.
    - [x] Implement mocked prediction flow tests.

---
*Last Updated: 2026-04-23*
