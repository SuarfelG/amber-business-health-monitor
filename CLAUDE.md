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



PHASE 1: Authentication only.



Do NOT build:

\- Stripe integration

\- GoHighLevel integration

\- Snapshot engine

\- Health scoring

\- Billing logic

\- Email delivery

\- Advisor comments

\- Password reset

\- Onboarding wizard



Only authentication.



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



