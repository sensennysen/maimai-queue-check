# Roadmap: Best 50 Downloadable Render

**Phases:** 2  
**v1 Requirements:** 7 (all mapped)  

---

## Phase 1: Best 50 Layout & PNG Export

**Goal:**  
Deliver a stable Best 50 view and a single, reliable PNG export path so you can replace manual screenshots with a built-in download.

**Covers requirements:**  
- LAY-01 — Full Best 50 view with all 50 entries in consistent order.  
- LAY-02 — Readable layout on common desktop resolutions.  
- EXP-01 — One-click PNG export control.  
- EXP-02 — Exported PNG matches the on-screen Best 50 and includes all 50 entries.  
- EXP-03 — Sensible default filename for the downloaded file.  

**Key workstreams:**  
1. Create a dedicated Best 50 page/section that composes existing score data and `ScoreCard` into a coherent layout.  
2. Introduce a dedicated Best 50 container (with a `ref`) that is safe to capture with `html-to-image`.  
3. Implement a `useBest50Export` hook that uses `html-to-image` and browser download APIs to generate and download a PNG.  
4. Wire a visible “Download Best 50” button to the export hook and validate that the PNG includes all entries without clipping.  

**Success criteria:**  
1. From the Best 50 view, clicking a single control downloads a PNG file.  
2. Visual spot-check confirms the PNG matches the on-screen Best 50 content (titles, grades, ratings) for multiple sample users.  
3. All 50 entries are present and readable in the exported image on a typical desktop viewport.  

---

## Phase 2: Cross-Browser UX & Reliability Polish

**Goal:**  
Make the Best 50 export experience dependable and self-explanatory across the main browsers you use.

**Covers requirements:**  
- UX-01 — Export works on at least your primary browsers (e.g., latest Chrome plus one other).  
- UX-02 — Failures are surfaced to the user with clear notifications.  

**Key workstreams:**  
1. Manually test the Best 50 export on at least two browsers and fix any layout/compat issues found.  
2. Add defensive checks around the export hook (missing `ref`, errors from `html-to-image`) and surface them via notifications.  
3. Tweak button placement, labels, and any microcopy so the export feature is obvious and understandable.  

**Success criteria:**  
1. Manual tests on at least two browsers confirm that exports succeed and images look correct.  
2. If export fails (e.g., due to a transient error), the user sees a notification explaining that export failed and suggesting a simple next step (reload/resize/try again).  
3. There are no obvious “dead ends” where a click does nothing without feedback.  

---

## Future Phases (v2+ Ideas, Not Committed)

These are potential follow-on efforts corresponding to v2 requirements (not part of the current v1 roadmap).

- Alternate layout presets for the Best 50 view (LAY-10).  
- Share-ready theme variants for exports (LAY-11).  
- Optional PDF export built on top of the same capture pipeline (EXP-10).  

These can become Phase 3+ in a future roadmap update once v1 is shipped and in use.

# Roadmap: SMF Queue Check — Address Codebase Concerns

## Overview

Remediation pass in fixed order: fix known bugs first, then performance and security, then fragile areas, then structural tech debt. Each phase groups related items; no new infrastructure or features. Delivers reduced risk and improved maintainability.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3, 4, 5): Planned milestone work
- Decimal phases (e.g. 2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 1: Bugs** - Fix getUserRoles API mismatch and align call sites
 (completed 2026-02-24 — implemented during Phase 5 refactor)
- [x] **Phase 2: Performance** - Measure and tune realtime/bundle; document service impact for Phase 5
 (completed 2026-02-24)
- [x] **Phase 3: Security** - Clear role cache on logout; rename cache key to user_roles_* with backward compatibility; document XSS and config policy
 (completed 2026-02-23)
- [x] **Phase 4: Fragile Areas** - Normalize branch ID, stabilize auth/roles loading, guards, geolocation
 (completed 2026-02-23)
- [x] **Phase 5: Tech Debt** - Split Supabase service, fix or justify ESLint disables, validation, swallowed rejections (completed 2026-02-23)

## Phase Details

### Phase 1: Bugs
**Goal**: Known bugs fixed; getUserRoles API aligned with call sites so role checks behave correctly.
**Depends on**: Nothing (first phase)
**Requirements**: BUGS-01
**Success Criteria** (what must be TRUE):
  1. getUserRoles is invoked with a consistent API (single userId or userId + branchId) at all call sites.
  2. Role-based behavior (admin, branch admin, etc.) works correctly in UI and guards with no API mismatch errors.
**Plans**: TBD

### Phase 2: Performance
**Goal**: Performance bottlenecks measured and tuned where appropriate; service bundle impact documented for Phase 5.
**Depends on**: Phase 1
**Requirements**: PERF-01, PERF-02
**Success Criteria** (what must be TRUE):
  1. Supabase realtime subscription scope and/or eventsPerSecond is documented or tuned so client/server load is acceptable.
  2. Service layer bundle impact is documented (or measured) as input to Phase 5; no structural change to the service in this phase.
**Plans**: TBD

### Phase 3: Security
**Goal**: Security considerations hardened; role cache cleared on sign-out; cache key renamed to user_roles_* with backward compatibility for existing sessions; XSS and config policy documented.
**Depends on**: Phase 2
**Requirements**: SEC-01, SEC-04, SEC-02, SEC-03
**Success Criteria** (what must be TRUE):
  1. On sign-out, all smf_user_roles_* and user_roles_* keys are removed from localStorage so role cache cannot persist after logout.
  2. Role cache uses key pattern user_roles_* (e.g. user_roles_{uid}). When reading, support both smf_user_roles_* and user_roles_* so users already logged in with the old key continue to work without re-login; when writing, use the new key; clear both key patterns on sign-out.
  3. Policy is documented: no new dangerouslySetInnerHTML without sanitization; existing uses verified (QueueRulesModal: DOMPurify; SongSelectionModal/SongDatabase: static CSS only).
  4. Policy is documented: app security depends on Supabase RLS; no secrets in VITE_* env vars (codebase already throws if missing).
**Plans**: TBD

### Phase 4: Fragile Areas
**Goal**: Fragile areas stabilized; branch ID consistent, branch list before storage read, roles failure visible, guards documented, geolocation preserved.
**Depends on**: Phase 3
**Requirements**: FRAG-01, FRAG-02, FRAG-03, FRAG-04, FRAG-05
**Success Criteria** (what must be TRUE):
  1. Branch ID type (number vs string) is consistent in BranchContext and maimai-selected-branch storage and comparison.
  2. Default/saved branch is selected only after branch list is loaded.
  3. When roles fetch fails, a non-blocking "roles could not be loaded" (or equivalent) is shown instead of silent fallback to default permissions.
  4. Guard/early-return behavior for critical paths is documented (and optionally minimal shared guards added) so new call sites handle null/[]/{} returns.
  5. Geolocation error handling and user-facing messages are preserved; permission/timeout behavior is documented for browsers that deny or lack geolocation.
**Plans**: TBD

### Phase 5: Tech Debt
**Goal**: Structural tech debt reduced; service split by domain with facade, ESLint disables fixed or explained, validation and errors improved.
**Depends on**: Phase 4
**Requirements**: DEBT-01, DEBT-02, DEBT-03, DEBT-04
**Success Criteria** (what must be TRUE):
  1. Supabase client is exported from one place; domain modules live under src/services/supabase/ and existing call sites work via a thin facade.
  2. Each ESLint disable (BranchSelector, PublicProfilePage, useMouseDragScroll, ThemeContext, BranchContext, AccessRequestModal) is either removed or has a short comment explaining why it is intentional.
  3. contactReportSchema file field uses a schema accepting File | undefined (or branded type) with same refines for size/type; z.any() removed.
  4. useQueueData no longer swallows getQueueEntries errors; at least error logging is present; optionally non-blocking error state or retry.
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Bugs | 1/1 | Complete    | 2026-02-24 |
| 2. Performance | 1/1 | Complete    | 2026-02-24 |
| 3. Security | 1/1 | Complete    | 2026-02-23 |
| 4. Fragile Areas | 1/1 | Complete    | 2026-02-23 |
| 5. Tech Debt | 4/4 | Complete    | 2026-02-23 |
| 6. Direct Import | 3/3 | Complete | 2026-02-25 |
| 7. SongDB Revamp | 0/0 | Pending | — |
| 8. Visitor Song Details | 0/1 | Pending | — |

---

### Phase 7: SongDB Revamp (otoge_db.json)

**Goal**: Replace the 7-table Supabase song database fetch with the bundled `otoge_db.json` static asset. Eliminates async network dependency for song metadata, makes the song database load instantly, and adds a region availability filter (JP / Intl / USA) to the Song Database page.

**Depends on**: Phase 6 (stable service layer)

**Requirements**:
- SONG-01: `songsService.getFullSongDatabase()` loads from `otoge_db.json` instead of 7 Supabase tables. All song data, sheet data, internal levels, and images are derived from the JSON.
- SONG-02: The `SongDatabaseContext` loads the JSON on first access for either the Songs page or the Profile page (not just Songs page).
- SONG-03: Song Database page gains a Region Availability filter (single-select: JP / Intl / USA). Default = no filter (all regions shown). Filters songs whose sheets are available in the selected region.

**Success Criteria** (what must be TRUE):
1. Visiting `/songs` shows songs instantly (no Supabase round-trip for song data).
2. Profile favorite songs still resolve correctly from the JSON-backed context.
3. Region filter on Song Database page correctly narrows results to songs available only in the selected region.
4. No regressions in existing SongDB features: search, category filter, version filter, level range, internal levels, detail modal.

### Phase 8: Visitor Song Details

**Goal**: Allow any visitor on a public profile page to open the song detail modal when clicking on a Most Played or Best 50 score card. Currently both modals are gated behind `isOwner`, making them inaccessible to visitors. This phase lifts those modals outside the owner gate while preserving comment-editing as an owner-only feature.

**Depends on**: Phase 7

**Requirements**:
- VIS-01: On a public profile, any visitor (logged-out or different account) can click a Most Played song card and see the `MaimaiSongDetailModal` with song info (title, artist, category, version, BPM, type, play count, difficulty).
- VIS-02: On a public profile, any visitor can click a Best 50 score card and see the `MaimaiSongDetailModal` with full score details (achievement, rating, DX score, DX stars, combo/sync tags, last played).
- VIS-03: The comment editing UI inside the modal remains visible only to the profile owner (`isOwnProfile={isOwner}`).

**Success Criteria** (what must be TRUE):
1. Logged-out user visits a public profile → clicks Most Played card → modal opens with song data.
2. Logged-out user visits a public profile → clicks Best 50 score card → modal opens with score details.
3. Profile owner still sees comment editing in Best 50 modal; visitors do not.
4. No regressions: owner-only modals (Import, Profile Picture Upload, Profile Settings) unaffected.

---

### Phase 6: Direct Import (Mobile Bookmarklet)

**Goal**: Mobile users can import maimai DX scores directly into the app without needing to use the clipboard. The bookmarklet POSTs the JSON payload to a Supabase Edge Function via a one-time session token; the app tab auto-detects and processes the import.

**Depends on**: Phase 5 (service layer must be stable before adding new services)

**Requirements**:
- FEAT-01: Session token table (`import_sessions`) with 15-min TTL and RLS
- FEAT-02: `receive-import` Edge Function validates token, writes payload, sets status = complete
- FEAT-03: Bookmarklet dual-mode: POSTs to Edge Function when `window.__smfToken` is set; falls back to clipboard otherwise
- FEAT-04: Import modal generates session, shows unique bookmarklet loader code, polls for completion, auto-processes

**Success Criteria** (what must be TRUE):
1. A logged-in mobile user can complete a score import without ever touching the clipboard.
2. The desktop clipboard flow is completely unchanged.
3. Session tokens expire after 15 minutes; used or expired tokens are rejected by the Edge Function.
4. The import modal cleans up the session row after a successful or cancelled import.

# Roadmap: Song Discussion

## Overview

**Goal**: Create a page where users can discuss songs from the song DB. Includes overall song details, a tagging section, 5-star ratings, and a comment section.

## Must-Haves
- [ ] Overall details of the song on the page
- [ ] Tagging section for song tags
- [ ] 1-5 star rating section
- [ ] Comment section for users to leave their thoughts

## Phases

### Phase 1: Database Foundation & APIs
**Status**: ✅ Complete
**Objective**: Design and implement Supabase tables for tags, ratings, and comments. Update service layer to interact with these new tables.

### Phase 2: Song Discussion Page Layout
**Status**: ✅ Complete
**Objective**: Create the new route and basic page layout, fetching and displaying the overall details of the selected song.

### Phase 3: Tagging & Rating Systems
**Status**: ✅ Complete
**Objective**: Build the UI and integrate the logic for users to leave and view tags, as well as submitting and displaying 1-5 star ratings.

### Phase 4: Comment Section
**Status**: ⬜ Not Started
**Objective**: Build the UI for the comment section, allowing users to submit comments and view existing ones.

### Phase 5: Polish & Final Integration
**Status**: ⬜ Not Started
**Objective**: Refine styling, handle loading/error states, and ensure mobile responsiveness and cross-browser compatibility.


