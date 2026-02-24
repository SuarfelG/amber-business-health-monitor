\# Amber - Business Health Monitor



This repository is built incrementally using Claude Code.



Claude must strictly follow the rules in this file.

If a request conflicts with these rules, these rules win.



------------------------------------------------------------

PROJECT PURPOSE

------------------------------------------------------------



This is a calm, minimal business health monitor for founder-led service businesses.



The product answers 3 questions:



1\. Are we okay? (Green / Yellow / Red)

2\. Why?

3\. What should I do next?



Primary output:

\- Weekly snapshot

\- Monthly snapshot



The UI exists mainly to:

\- Authenticate users

\- Connect integrations

\- View snapshots

\- Invite advisor

\- Manage billing



This is NOT:

\- A dashboard tool

\- A KPI explorer

\- Accounting software

\- A customizable analytics system



Simplicity is mandatory.



If a feature does not improve the weekly or monthly snapshot,

it does not ship.



------------------------------------------------------------

REPOSITORY STRUCTURE

------------------------------------------------------------



apps/

&nbsp; web/        → React frontend

&nbsp; server/     → Node backend API



packages/

&nbsp; core/       → Pure business logic (no framework code)



------------------------------------------------------------

ARCHITECTURE RULES (NON-NEGOTIABLE)

------------------------------------------------------------



1\. Business calculations live ONLY in packages/core.

2\. Backend handles API, authentication, persistence, background jobs.

3\. Frontend renders data only.

4\. No calculation logic in frontend.

5\. No Express/Prisma code inside packages/core.

6\. No direct DB access from frontend.

7\. Keep modules small and isolated.



If unsure where something belongs:

Default to backend.

Never default to frontend.



------------------------------------------------------------

HOW CLAUDE MUST OPERATE

------------------------------------------------------------



When implementing any feature:



STEP 1: Briefly explain the implementation plan.

STEP 2: Implement ONLY what was requested.

STEP 3: Stop.



Do not:

\- Continue into future phases.

\- Anticipate future features.

\- Refactor unrelated files.

\- Rewrite working code without instruction.

\- Introduce new libraries unless explicitly approved.



Prefer:

\- Small edits

\- Clear code

\- Direct logic

\- Boring, readable implementations



Avoid:

\- Over-abstraction

\- Generic utility dumping

\- Premature optimization

\- Deep inheritance trees

\- Clever patterns



One concern per file.



------------------------------------------------------------

TECH STACK

------------------------------------------------------------



Frontend:

\- React

\- TypeScript

\- Tailwind

\- Simple routing

\- Minimal state management



Backend:

\- Node

\- Express

\- TypeScript

\- Prisma

\- PostgreSQL

\- bcrypt

\- JWT (access + refresh tokens)



------------------------------------------------------------

CURRENT BUILD PHASE

------------------------------------------------------------



PHASE 2: Integration layer (Stripe & GoHighLevel).



Build incrementally toward full integration:

\- OAuth and secure API key storage

\- Webhook handling and idempotent processing

\- Daily sync with rate-limit and retry logic

\- Pagination and efficient data fetching

\- 90-day historical backfill on first connection

\- Normalized revenue and CRM metrics storage

\- Multi-tenant isolation with HTTPS-only communication

\- No sensitive data (PCI, SMS, email bodies, notes) in storage



Do NOT build yet:

\- Snapshot engine

\- Health scoring

\- Billing logic

\- Email delivery

\- Advisor comments

\- Password reset

\- Onboarding wizard



------------------------------------------------------------

AUTHENTICATION SPECIFICATION

------------------------------------------------------------



GOAL:

User can:

\- Register

\- Log in

\- Stay logged in

\- Log out



------------------------------------------------------------

USER MODEL

------------------------------------------------------------



User:

\- id

\- email (unique)

\- passwordHash

\- name

\- businessName

\- timezone

\- currency

\- role (OWNER | ADVISOR)

\- createdAt

\- updatedAt



------------------------------------------------------------

TOKEN STRATEGY

------------------------------------------------------------



Access token:

\- Expires in 15 minutes



Refresh token:

\- Expires in 7 days

\- Stored in database

\- Sent via httpOnly cookie



Frontend:

\- Store access token in memory

\- Never store tokens in localStorage



Never:

\- Return passwordHash

\- Expose stack traces

\- Leak internal errors



------------------------------------------------------------

BACKEND REQUIREMENTS

------------------------------------------------------------



Create:



src/modules/auth/



Files:

\- auth.routes.ts

\- auth.controller.ts

\- auth.service.ts

\- auth.middleware.ts



Endpoints:



POST   /auth/register

POST   /auth/login

POST   /auth/refresh

POST   /auth/logout

GET    /auth/me



All protected routes must use JWT middleware.



Return human-friendly errors only.



------------------------------------------------------------

FRONTEND REQUIREMENTS

------------------------------------------------------------



Routes:

\- /auth (login/register toggle)

\- Protected routes redirect to /auth if unauthenticated



UI principles:

\- Centered card

\- Large typography

\- Calm spacing

\- Minimal inputs

\- No dense layouts



Tone:

“Welcome back.”

“Create your account.”

Not technical language.



------------------------------------------------------------

CODE STYLE RULES

------------------------------------------------------------



\- Use descriptive function names.

\- Keep functions small.

\- Avoid nested logic where possible.

\- Do not introduce unnecessary interfaces.

\- Do not create “base” classes.

\- Avoid global state unless necessary.

\- Avoid magic constants (use config file).



Files should remain short and focused.



------------------------------------------------------------

ERROR HANDLING

------------------------------------------------------------



Backend:

\- Catch errors centrally.

\- Return safe, human messages.

\- Log detailed errors internally only.



Frontend:

\- Never show raw backend error.

\- Use supportive tone:

&nbsp; “Something went wrong. Try again.”



------------------------------------------------------------

ACCEPTANCE CRITERIA FOR PHASE 1

------------------------------------------------------------



Authentication phase is complete when:



\- User can register

\- User can log in

\- Protected routes work

\- Session persists after refresh

\- Refresh token renews access token

\- Logout invalidates refresh token

\- No sensitive data leaks

\- Code compiles without warnings

\- No unused code



------------------------------------------------------------

PHASE 2: INTEGRATION SPECIFICATION

------------------------------------------------------------



DATABASE SCHEMA

------------------------------------------------------------



Add to User model:

\- stripeAccountId (nullable)

\- ghlAccountId (nullable)



Create tables:

\- IntegrationCredential (encrypted API keys/tokens)

\- StripeCustomer (id, email, created)

\- StripeCharge (amount, currency, status, created, userId)

\- StripeInvoice (amountPaid, status, created, userId)

\- StripeRefund (amount, created, userId)

\- StripeSubscription (status, created, userId)

\- GHLContact (id, created)

\- GHLLead (timestamp, userId)

\- GHLDeal (status, pipelineStage, value, closeDate, userId)

\- GHLAppointment (date, status, userId)

\- WebhookLog (provider, eventId, processed, createdAt)



Add normalized aggregates:

\- RevenueAggregate (userId, period, totalRevenue, refunds, netRevenue, revenuePerCustomer, ltv)

\- CRMAggregate (userId, period, leadsCount, appointmentsCount, showRate, dealsWon, dealValue)



STRIPE INTEGRATION

------------------------------------------------------------



Connection:

\- Secure OAuth (preferred) or encrypted API key storage

\- Store tokens in IntegrationCredential with AES-256 encryption

\- Validate connection on save



Data Fetching:

\- Fetch: customers, charges, invoices, refunds, subscriptions

\- Minimum fields only (no card details, no PCI data)

\- Pagination: 100 items per request

\- Rate limit: 100 requests per second (Stripe limit)

\- Retry: exponential backoff (3 retries max)



Daily Sync Job:

\- Run at configurable time (user timezone)

\- Fetch last 7 days of changes (after first backfill)

\- First connection: backfill 90 days

\- Idempotent: skip duplicates via charge/invoice/refund ID

\- Log all syncs (success/failure)



Webhook Handling:

\- Listen to: charge.created, charge.refunded, customer.created, invoice.created, customer.subscription.created

\- Validate webhook signature

\- Process idempotently (check eventId in WebhookLog)

\- Acknowledge within 5 seconds



Normalized Storage:

\- RevenueEvent: amount, currency, status, timestamp, customerId

\- RefundEvent: amount, timestamp, chargeId

\- NetRevenue: charges - refunds per period

\- Revenue per customer: total charges / unique customers

\- LTV (realised): sum of all charges for each customer (no projections)

\- Weekly/monthly aggregates: totals by period



GOHLEVEL INTEGRATION

------------------------------------------------------------



Connection:

\- Secure OAuth (if available) or encrypted API key storage

\- Store tokens in IntegrationCredential with AES-256 encryption

\- Validate connection on save



Data Fetching:

\- Fetch: contacts, leads, deals/opportunities, appointments

\- Minimum fields only (no SMS, email bodies, notes, message content)

\- Pagination: 100 items per request

\- Rate limit: handle 429 responses with backoff

\- Retry: exponential backoff (3 retries max)



Daily Sync Job:

\- Run at configurable time (user timezone)

\- Fetch last 7 days of changes (after first backfill)

\- First connection: backfill 90 days

\- Idempotent: skip duplicates via contact/lead/deal ID

\- Log all syncs (success/failure)



Normalized Storage:

\- Leads per week/month: count by period

\- Appointments per week/month: count by period

\- Show rate: shown/no-show by period

\- Won deals: status == 'won' with value and close date

\- Pipeline metrics: deals by stage



SECURITY REQUIREMENTS

------------------------------------------------------------



\- All integration credentials encrypted at rest (AES-256)

\- All API communication over HTTPS only

\- No secrets exposed to frontend

\- Webhook signatures validated on every request

\- Separate database encryption key from JWT secret

\- Idempotent webhook processing (prevent double-charges)

\- Multi-tenant isolation: always filter by userId

\- Rate limiting on all external API calls

\- Audit log of all connection changes



ACCEPTANCE CRITERIA FOR PHASE 2

------------------------------------------------------------



Foundation (Step 1):

\- Database schema updated with integration tables

\- Encryption service created (encrypt/decrypt credentials)

\- IntegrationCredential model with API key storage

\- User model updated with integration account IDs



Stripe Connection (Step 2):

\- POST /integrations/stripe/connect (OAuth or API key)

\- Validate and store credentials securely

\- Test connection endpoint

\- Webhook endpoint listening



Stripe Sync (Step 3):

\- Daily sync job runs on schedule

\- Fetches customers, charges, invoices, refunds

\- Backfill 90 days on first connection

\- Store in normalized tables

\- Webhook processing for charge events



Stripe Aggregates (Step 4):

\- Calculate revenue per period

\- Store weekly/monthly aggregates

\- Compute LTV, revenue per customer, refund totals



GHL Connection (Step 5):

\- POST /integrations/ghl/connect (OAuth or API key)

\- Validate and store credentials securely

\- Test connection endpoint



GHL Sync (Step 6):

\- Daily sync job runs on schedule

\- Fetch contacts, leads, deals, appointments

\- Backfill 90 days on first connection

\- Store in normalized tables



GHL Aggregates (Step 7):

\- Calculate leads per period

\- Store weekly/monthly aggregates

\- Compute show rates, won deals

\- Pipeline metrics



Final Polish (Step 8):

\- Frontend: "Connect Stripe" and "Connect GHL" buttons

\- Dashboard: show connection status

\- Error handling and retry logic

\- Full audit logging

\- No unused code, no warnings



------------------------------------------------------------

DEVELOPMENT DISCIPLINE

------------------------------------------------------------



Claude must:



\- Read relevant files before editing.

\- Modify only necessary files.

\- Avoid duplicate logic.

\- Maintain folder structure.

\- Keep changes minimal and focused.



If unsure about scope:

Ask for clarification instead of guessing.



------------------------------------------------------------

END OF CURRENT PHASE

------------------------------------------------------------



After Phase 1 is complete,

wait for explicit instruction before starting Phase 2.



