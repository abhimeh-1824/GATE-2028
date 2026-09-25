# GATE DA 2028 React Frontend Regression Audit

Date: 2026-09-25

## Scope

Regression audit after the reported fixes. Focused only on critical/high runtime, React, authentication, protected access, API, state, XSS, sensitive-data, and severe performance issues. No application source code was modified.

## Verification Results

- `npm run build`: PASS.
- `npx tsc --noEmit`: PASS.
- `npm audit --omit=dev`: PASS, 0 vulnerabilities.
- Build warning remains: at least one bundle chunk exceeds 500 kB.
- Source review confirms new sync payload validation, rate limiting, bounded body size, demo isolation, test ownership, error aggregation, password reset, Escape handling, and task session checks.
- Browser demo-flow rerun could not complete because the shared browser page was not interactable/visible. No new browser pass is claimed from that attempt.

## Remaining Critical Issues

### 1. Sync API still has no authenticated user ownership

- **File:** `server.ts`
- **Function:** `/api/sync/:appletId` POST and GET handlers
- **Problem:** Rate limiting, applet allowlisting, payload validation, and storage bounds were added, but the endpoints still accept and return payloads without verifying a Supabase access token or user ownership.
- **Why it happens:** Authorization is based only on whether the applet ID is in `ALLOWED_APPLET_IDS`. Any caller can use an allowed ID.
- **Severity:** Critical
- **Exact fix:** Add middleware that validates the Supabase bearer token, derive the user ID from the token, store records by user plus applet ID, require ownership on GET, and ignore any client-supplied `payload.user` identity.

### 2. LocalStorage identity still bypasses session truth

- **Files:** `src/context/StudyContext.tsx`, `src/lib/supabaseService.ts`
- **Functions:** `StudyProvider` initialization, `getSavedAccounts`, `getActiveUserId`
- **Problem:** `currentUser` is still initialized from localStorage before a verified Supabase session is loaded.
- **Why it happens:** The auth listener only handles `SIGNED_OUT`; it does not replace local identity on `INITIAL_SESSION`, `SIGNED_IN`, `TOKEN_REFRESHED`, or `USER_UPDATED`.
- **Severity:** High
- **Exact fix:** Start with an explicit `authLoading` state, call `supabase.auth.getSession()`, map only the verified Supabase user into `currentUser`, handle all relevant auth events, and treat localStorage as a cache only.

### 3. Demo identity still enters the protected portal without Supabase authentication

- **Files:** `src/App.tsx`, `src/context/StudyContext.tsx`
- **Function:** `loginAsDemo`
- **Problem:** Demo mode sets `currentUser`, which satisfies the same portal gate used for real authenticated users.
- **Why it matters:** The UI boundary does not distinguish a sandbox from a verified account, and future portal features can accidentally send demo identity to protected APIs.
- **Severity:** High
- **Exact fix:** Add an explicit `isDemo`/`authMode` state, render demo data through a separate sandbox path, disable all authenticated API operations, and prevent demo identity from being treated as authorization.

### 4. Provider performs database work before authentication is known

- **File:** `src/context/StudyContext.tsx`
- **Function:** initial database `useEffect`
- **Problem:** `fetchSyllabusFromDatabase(initialData.subjects)` runs on provider mount, including while the public landing page is displayed.
- **Why it happens:** The effect is unconditional and does not wait for a verified session or public-read decision.
- **Severity:** High
- **Exact fix:** Gate the request on an explicit auth state, or use a deliberately public read-only endpoint. Do not run protected Supabase operations for unauthenticated visitors.

## Remaining High-Priority API and Data Issues

### 5. Peer directory still lacks privacy/ownership guarantees

- **Files:** `src/lib/peerProgressService.ts`, `src/components/views/PeerCompareView.tsx`
- **Functions:** `getAllPeerProfilesFromDatabase`, peer directory
- **Problem:** The client reads profile and progress data for the cohort and uses client-side filtering. Selecting limited columns reduces exposure but does not establish user consent or row ownership.
- **Severity:** High
- **Exact fix:** Provide a server-side shareable-profile view, add opt-in visibility, remove private fields from the client model, and enforce RLS for every profile/progress query.

### 6. Remote peer profiles can still be built from local/demo fallback data

- **File:** `src/lib/peerProgressService.ts`
- **Function:** `getAllPeerProfilesFromDatabase`
- **Problem:** A synthetic demo/current profile is constructed when no verified current user exists, and remote progress can still be reconstructed from local/default data.
- **Severity:** High
- **Exact fix:** Do not represent a profile as real unless its progress comes from authenticated user-owned database records. Return an explicit unavailable state instead.

### 7. Imported backup validation remains incomplete

- **File:** `src/context/StudyContext.tsx`
- **Function:** `importDataJson`
- **Problem:** Validation now checks some subject structure and primitive fields, but tasks, mock tests, milestones, calendar events, and settings are accepted when they are merely arrays/objects. Individual records, enums, required fields, lengths, and numeric bounds are not fully validated.
- **Severity:** High data-integrity risk
- **Exact fix:** Validate the complete versioned export schema at runtime, including every record field, enum, ID relationship, array length, numeric range, and migration version. Apply state only after the entire document passes.

### 8. Canonical syllabus writes remain globally scoped

- **Files:** `src/context/StudyContext.tsx`, `src/lib/supabaseService.ts`, `src/components/views/SubjectsView.tsx`
- **Functions:** `syncSyllabusToDb`, `saveSyllabusToDatabase`
- **Problem:** Normal users can invoke controls that write shared `subjects`, `topics`, and `subtopics` tables. RLS may reject the request, but the frontend still exposes the operation and does not establish user ownership.
- **Severity:** High integrity risk
- **Exact fix:** Make the official syllabus read-only for students. Move canonical syllabus writes to an admin-only backend operation, or store user-specific curriculum copies under authenticated ownership.

## Remaining State and Runtime Issues

### 9. User-switch request protection is incomplete

- **File:** `src/context/StudyContext.tsx`
- **Function:** `switchUser`
- **Problem:** The task response checks `getActiveUserId()` before merging, but the request is not cancelled and the guard is based on mutable localStorage rather than the verified React/Supabase session.
- **Severity:** High
- **Exact fix:** Use an AbortController/request generation token and verify both the current React user and the current Supabase session before applying results.

### 10. Separate persistence effects can write during account transitions

- **File:** `src/context/StudyContext.tsx`
- **Function:** localStorage persistence effects
- **Problem:** Multiple state slices are updated independently during account changes while each slice has its own persistence effect.
- **Severity:** High data-integrity risk
- **Exact fix:** Add an explicit switching state, suspend persistence while switching, install the complete target state atomically, then persist using the verified user ID.

### 11. Auto-sync still sends broad full-state payloads

- **Files:** `src/context/StudyContext.tsx`, `src/lib/linkedAppletSyncService.ts`
- **Problem:** Subject, task, mock, settings, and hours changes can trigger complete snapshots through localStorage, BroadcastChannel, Express, and Supabase.
- **Severity:** High performance/network risk
- **Exact fix:** Debounce by entity, cancel stale requests, send versioned deltas, cap payload size, and sync only after authenticated state changes.

## Resolved Findings Confirmed in Current Source

- Sync client now checks non-2xx responses and returns persistence failure when both remote stores fail.
- Runtime `validateAppletSyncPayload` exists for incoming linked payloads.
- Express body size is reduced to 1 MB.
- Express sync endpoints have an allowlist, bounded in-memory storage, and an IP rate limiter.
- Demo users skip cloud sync and use a local sandbox status.
- Task Supabase writes verify the current Supabase session and reject mismatched caller IDs.
- Mock-test sync now includes `student_id` and deterministic IDs include the user ID.
- Peer sync collects write errors and returns partial-failure status.
- Email-confirmation login fallback was removed.
- Password reset flow exists.
- Authentication modal Escape handling exists.
- `PeerDetailModal` conditional-hook issue is fixed by using a child component.
- Calendar initialization uses the current date.
- Custom resource URLs are parsed with `URL` and restricted to HTTP/HTTPS.
- An application-level `ErrorBoundary` exists.
- No verified `dangerouslySetInnerHTML`, `innerHTML`, or `eval` sink was found.

## Build and Runtime Caveat

A passing build and type-check do not prove authorization correctness. The sync API can compile and rate-limit requests while still exposing allowed applet payloads to unauthenticated callers. Backend authorization and RLS must be tested with real authenticated and unauthorized requests.

## Required Regression Tests

1. GET sync endpoint without a bearer token must return 401/403.
2. POST sync endpoint without a bearer token must return 401/403.
3. User A must not read or overwrite User B's applet payload.
4. Demo mode must not issue Supabase or Express writes.
5. Refresh with an expired Supabase session must return to the landing page.
6. `INITIAL_SESSION` and `TOKEN_REFRESHED` must update the React user state.
7. Rapid user switching must not merge old-user tasks into the new account.
8. Malformed backup records must be rejected without changing state.
9. Syllabus write controls must be unavailable to ordinary students.
10. Auto-sync failure must show an error state and never report success.

## Final Verdict

The claimed fixes improved validation, rate limiting, demo isolation, sync error reporting, ownership fields, and auth UX. Build, TypeScript, and dependency checks pass. The platform is still not production-safe because the server sync API has no authenticated ownership enforcement, the provider still trusts localStorage identity before session validation, and protected database work starts before authentication is resolved.

No application source code was modified during this regression audit.
