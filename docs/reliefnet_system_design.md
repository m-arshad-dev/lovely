# ReliefNet Production System Design (Flutter + Node/Express + Postgres)

## 1) Full Architecture Overview
- **Clients:** Flutter app (Android/iOS/Web) with role-aware navigation shells.
- **API Gateway Layer:** Express app exposes REST endpoints, JWT auth middleware, RBAC guards.
- **Core Domain Modules:** auth, onboarding, users, roles, campaigns, donations, volunteers, beneficiary-requests, admin moderation, notifications.
- **Data Layer:** PostgreSQL as source of truth; Redis for caching, rate limits, and queue broker.
- **Async Processing:** BullMQ workers for receipts, fraud checks, push/email notifications, report generation.
- **Realtime:** Socket.IO for campaign updates, donation stream, volunteer assignment updates, and beneficiary request status.
- **Integrations:** Stripe/local gateway webhooks; FCM/APNs push; SMTP provider.
- **Observability:** structured logs, traces, metrics, health/readiness endpoints, audit log table.

## 2) PostgreSQL Schema (Core)
- `users(id, email, password_hash, full_name, phone, is_active, created_at)`
- `roles(id, code, name)` with seeded codes: `admin`, `ngo_representative`, `donor`, `volunteer`, `beneficiary`
- `user_roles(id, user_id, role_id, is_active, status, assigned_at)`
- `ngo_profiles(id, user_id, legal_name, registration_no, verification_status, reviewed_by, reviewed_at)`
- `campaigns(id, ngo_profile_id, title, description, category, location_text, lat, lng, target_amount, current_amount, volunteer_required_count, beneficiary_targeting, status, created_by, approved_by, approved_at, created_at)`
- `campaign_updates(id, campaign_id, body, media_url, created_by, created_at)`
- `donations(id, campaign_id, donor_user_id, amount, currency, provider, provider_payment_id, is_anonymous, status, receipt_url, created_at)`
- `volunteer_profiles(id, user_id, bio, availability_json, skills_json, rating_avg)`
- `volunteer_assignments(id, campaign_id, volunteer_user_id, task_type, status, assigned_by, assigned_at, completed_at, feedback)`
- `beneficiary_requests(id, beneficiary_user_id, campaign_id, request_type, description, urgency_level, latitude, longitude, status, created_at, updated_at)`
- `beneficiary_request_status_logs(id, beneficiary_request_id, previous_status, new_status, changed_by_user_id, notes, created_at)`
- `notifications(id, user_id, type, title, body, channel, is_read, sent_at, created_at)`
- `audit_logs(id, actor_user_id, action, entity_type, entity_id, metadata_json, created_at)`

## 3) API Endpoints (Representative)
- **Auth:** `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`
- **Onboarding:** `GET /onboarding/tour`, `POST /onboarding/role-selection`, `POST /onboarding/ngo-verification-request`
- **Campaigns:** `POST /campaigns`, `GET /campaigns`, `GET /campaigns/:id`, `PATCH /campaigns/:id/status`, `POST /campaigns/:id/updates`
- **Donations:** `POST /donations/intent`, `POST /donations/confirm`, `GET /donations/my-history`, `POST /webhooks/stripe`
- **Volunteers:** `POST /volunteers/profile`, `PATCH /volunteers/availability`, `POST /volunteers/assignments/:id/accept`, `POST /volunteers/assignments/:id/complete`
- **Beneficiaries:** `POST /beneficiary-requests`, `GET /beneficiary-requests/my`, `PATCH /beneficiary-requests/:id/status`
- **Admin:** `GET /admin/ngo-approvals`, `PATCH /admin/ngo-approvals/:id`, `GET /admin/campaign-approvals`, `PATCH /admin/campaign-approvals/:id`, `GET /admin/analytics`
- **Notifications:** `GET /notifications`, `PATCH /notifications/:id/read`

## 4) Flutter App Structure
```text
lib/
  core/ (api client, auth state, websocket client, theme, constants)
  features/
    auth/
    onboarding/
    campaigns/
    donations/
    volunteers/
    beneficiary_requests/
    notifications/
    admin/
  role_shells/
    admin_shell.dart
    ngo_shell.dart
    donor_shell.dart
    volunteer_shell.dart
    beneficiary_shell.dart
  routing/
    app_router.dart
```
Use `go_router` with role guards and onboarding completion checks.

## 5) Node Backend Structure
```text
src/
  app.js
  config/ (db, redis, env, socket)
  middlewares/ (auth, rbac, validation, rate-limit)
  modules/
    auth/
    users/
    roles/
    onboarding/
    campaigns/
    donations/
    volunteers/
    beneficiary_requests/
    notifications/
    admin/
  workers/
  utils/
```

## 6) Realtime Socket Design
- Rooms:
  - `user:{userId}` private events
  - `campaign:{campaignId}` campaign stream
  - `role:admin` moderation queue events
- Events emitted:
  - `campaign.updated`
  - `donation.received`
  - `beneficiary_request.updated`
  - `volunteer.assignment.updated`
- Auth: JWT handshake middleware, user joins allowed rooms only.

## 7) Key Design Decisions & Tradeoffs
- **JWT chosen** for stateless horizontal scaling; token revocation handled via short-lived access + refresh token table.
- **Postgres-first consistency** for funds and approvals; Redis only for performance.
- **Event + queue split:** socket notifications are near-real-time, durable side effects (emails/receipts) go through BullMQ.
- **Approval gates** (NGO + campaign) reduce fraud but add operational latency; admin tooling mitigates this with queues and SLAs.
- **Beneficiary status logs** provide accountability/auditability for humanitarian compliance.
