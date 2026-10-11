# Urban Beautician — MVP Specification

Status: implementation brief for VS Code + GitHub Copilot.

## 1. Objective

Build an Android-first web application where a person can create a location-based civic record represented by an animated 3D character, and other people can discover that record through a shared map dashboard.

The character is a visualization of a persistent database record. Database persistence must work independently of AR support.

The first release must demonstrate:

> A contributor creates a beautician on phone A. Someone opens its shared link on phone B, sees the same saved message, location, and character, and can manually place that character in AR on a supported device.

## 2. Scope and non-goals

### Required for the MVP

- Public map and list of visible beauticians.
- Shareable record detail pages.
- Contributor authentication through Supabase email sign-in.
- Creation of a record with location, character, animation, message, and optional reference photo.
- An ordinary animated 3D preview that does not require AR.
- Surface detection and tap-to-place AR on compatible Android devices.
- Manual AR re-placement of an existing saved record.
- Owner comments and record updates; moderator resolution and hiding.
- A shared database, photo storage, and database-enforced authorization.
- Static deployment to GitHub Pages from a GitHub repository.

### Explicitly out of scope

- Unity, native Android applications, and app-store distribution.
- Automatic cross-session or cross-device spatial alignment.
- Cloud anchors, visual positioning services, marker tracking, or image tracking.
- Automatically generating characters or animations.
- User-uploaded 3D assets.
- Cryptocurrency, rewards, points, payments, and subscriptions.
- AI agents inside the deployed application.
- Offline writes, push notifications, and realtime synchronization.
- Guaranteed AR support on every Android phone or on iOS.

Start with an invite-only contributor pilot. Public reading is permitted; unrestricted public contribution is not a launch requirement.

## 3. Recommended technology

- Frontend: TypeScript + Vite, using plain DOM components initially.
- Rendering: Three.js with GLTFLoader and AnimationMixer.
- Assets: curated animated glTF binary files (`.glb`).
- AR: WebXR immersive-ar with hit-test; feature detection at runtime.
- Dashboard: Leaflet, with a configurable tile provider and visible attribution.
- Database: Supabase PostgreSQL with PostGIS.
- Authentication: Supabase Auth email sign-in.
- Photos: Supabase Storage.
- Deployment: GitHub Pages using GitHub Actions.
- Tests: Vitest for unit tests and Playwright for non-AR browser tests.

Use current compatible package releases and commit the lockfile. Avoid adding a UI framework, custom API server, state-management framework, or PWA service worker unless a concrete requirement justifies it.

## 4. Persistence and placement contract

There are two separate coordinate systems:

1. Geographic coordinates identify an approximate place on the map.
2. WebXR coordinates position the character within the current AR session.

A WebXR session pose must never be interpreted as a durable world-space position. Saving an x/y/z value does not restore a character to the same corner after a reload or on another phone.

For the MVP:

- Persist geographic location, accuracy, place description, and reference photo.
- Place the character manually in each AR session.
- Label the action `Place here in AR`, not `Restore exact position`.
- Explain briefly: `The record is saved. Exact AR placement must be chosen again when you reopen it.`
- Do not save session-local transforms as authoritative anchor data.
- Keep an explicit future extension point for marker or other anchor-based relocalization.

A reference photo guides the user; it does not provide automatic image tracking.

## 5. User roles

### Visitor

- Reads visible records, photos, comments, and asset metadata.
- Uses the map, list, 3D preview, and supported AR experience.
- Cannot submit or modify records.

### Contributor

- Is an authenticated, approved pilot participant.
- Creates records owned by their authenticated user ID.
- Edits the message, location description, character selection, and photo of their own records.
- Resolves their own records.
- Adds comments to visible records.
- Cannot modify another contributor's record or grant themselves privileges.

### Moderator

- Has an explicitly assigned server-managed role.
- Can resolve, reopen, or hide any record and remove inappropriate updates.
- Is initially configured by a project administrator, not by the frontend.

## 6. User flows

### A. Browse

1. Open the application without signing in.
2. Show a map and an equivalent accessible list.
3. Request location only after an explicit `Near me` action.
4. If permission is refused, allow browsing and manual map navigation.
5. Load records inside the map viewport, with a bounded result limit.
6. Filter by open or resolved status; hidden records never appear publicly.
7. Selecting a pin or list item opens the same detail view.

### B. Create

1. Sign in as an approved contributor.
2. Choose `Create beautician`.
3. Request device location; store reported accuracy if available.
4. Allow manual pin placement or correction. Creation must work without GPS permission.
5. Select an approved character and one of its available animation clips.
6. Enter message and place description; optionally add a reference photo.
7. Preview the animated model.
8. Optionally enter AR and tap a detected surface to place it.
9. Save the record independently of AR. Prevent duplicate saves while a request is pending.
10. Open the saved detail view and offer a copyable share link.

A failed save must preserve the form and present a retry action. AR placement alone must not silently create a database record.

### C. Reopen and place

1. Open a shared record link.
2. Read its message, geographic location, description, and reference photo.
3. Show an ordinary animated 3D preview.
4. On a supported device, offer `Place here in AR`.
5. Start a new AR session, find a surface, and tap to place the saved character manually.
6. Re-placement does not change the record's geographic location or create a duplicate.

### D. Update

- A signed-in contributor can add a comment to a visible record.
- Owners can edit their own record and resolve it.
- Moderators can change status and hide a record.
- Successful status changes append an activity entry atomically.
- Refresh the dashboard after a successful write; polling or realtime subscriptions are not required.

## 7. Screens and routing

Use hash routing to support direct links on GitHub Pages without a server fallback:

- `#/` — map and list dashboard.
- `#/beauticians/:id` — record detail.
- `#/create` — creation form.
- `#/sign-in` — authentication.

AR is a mode launched from the creation or detail screen, not a separate persistent route.

Handle authentication callbacks before normal route parsing; test this with the actual Supabase redirect configuration. For simplicity, email one-time-code entry is acceptable and avoids callback/hash conflicts.

Provide clear loading, empty, error, permission-denied, and unsupported-device states. The list and detail view must remain usable without geolocation, camera access, or WebXR.

## 8. Data model

Use SQL migrations committed to the repository. All primary record IDs are UUIDs unless stated otherwise. Timestamps are server-generated timestamptz values.

### assets

- `id`: text primary key; stable curated identifier.
- `label`: text, required.
- `model_url`: text, required; approved same-site or trusted HTTPS location.
- `animation_names`: text array of supported clip names.
- `default_scale`: positive numeric value.
- `enabled`: boolean, default true.

Asset metadata is publicly readable. Only administrators modify the asset catalog.

### beauticians

- `id`: UUID primary key.
- `created_by`: UUID referencing auth.users; assigned from authenticated identity.
- `created_at`, `updated_at`: server timestamps.
- `location`: PostGIS geography(Point, 4326), required.
- `location_accuracy_m`: nullable nonnegative numeric value.
- `location_source`: `gps` or `manual`.
- `place_description`: text, maximum 300 characters.
- `reference_photo_path`: nullable storage object path, not a temporary signed URL.
- `asset_id`: foreign key to assets.
- `animation_name`: valid clip name for the selected asset.
- `message`: required text, 1–1000 characters after trimming.
- `status`: `open`, `resolved`, or `hidden`; default open.
- `placement_mode`: `manual` for MVP.
- `anchor_data`: nullable jsonb, null for MVP; reserved for future versioned anchor metadata.

Add a GiST spatial index on location and useful indexes on status and created_at. Validate longitude and latitude before constructing the geographic point. PostGIS points use longitude first, latitude second.

If a user adjusts a GPS pin, set location_source to manual and clear location_accuracy_m; GPS accuracy no longer describes the manually selected point.

### updates

- `id`: UUID primary key.
- `beautician_id`: foreign key to beauticians.
- `created_by`: authenticated user UUID.
- `created_at`: server timestamp.
- `kind`: `comment` or `status_change`.
- `body`: text; comments limited to 1000 characters.
- `old_status`, `new_status`: nullable status values for status-change events.

Comments are submitted through a constrained operation. Status-change events are generated by trusted database logic, not freely inserted by clients.

### contributor_access

- `user_id`: UUID primary key referencing auth.users.
- `role`: `contributor` or `moderator`.

Administrator-managed only. Never expose emails or account records through public queries. Do not return creator account IDs in public response objects unless actually needed.

### Read/write API contracts

Provide typed operations for:

- Fetch enabled assets.
- Fetch public records in a viewport, with status filter and result cap.
- Fetch a single visible record and paginated updates.
- Fetch authorized moderation records.
- Create a record.
- Edit an owned record.
- Append a comment.
- Resolve/reopen/hide a record as authorized.

Use Supabase queries and narrowly scoped SQL functions where appropriate. Prefer invoker-rights functions; any security-definer function must have a fixed safe search_path and explicit authentication and authorization checks. Do not let an RPC bypass the intended RLS rules.

## 9. Security and privacy

Security is required before deployment, not a later enhancement.

- Enable Row Level Security on every exposed table and storage objects.
- Pair policies with appropriate SQL grants.
- Public users read only open/resolved records and updates belonging to those records.
- Only approved authenticated contributors create records.
- Owners cannot change created_by, grant roles, or alter other people's records.
- Only moderators can set hidden status.
- Validate editable fields and status transitions in the database, not only in UI code.
- Never render messages as raw HTML.
- Never ship Supabase secret/service-role keys to the browser, repository, or frontend build.
- A Supabase publishable key is public configuration; it is not an authorization boundary.
- Store photos in a private bucket. Authorize reads based on associated record visibility and return short-lived signed URLs.
- Hiding a record blocks future photo URL issuance; already issued signed URLs may remain usable until expiry. Use a short expiry and document this limitation.
- Restrict uploads to approved contributors and owned paths; validate supported image types and enforce a 5 MB cap.
- Resize/re-encode photos where practical to reduce payload and remove EXIF metadata. Account for orientation during conversion.
- Photos are ordinary reference images, not guaranteed AR screenshots.
- Do not track background location or retain users' movement histories.
- Ask users to avoid identifiable faces and private interiors in public reference photos.

For an open public contribution launch, first add enforceable rate limits/quotas, abuse reporting, moderation processes, and cost controls. Client-only throttling is not sufficient.

## 10. 3D and AR requirements

### Asset handling

- Begin with one real project asset and at least one animation clip.
- Provide a clearly labeled placeholder if no asset has been supplied; do not claim it is the project's character.
- Validate model scale, orientation, texture loading, and clip names on a real phone.
- Loop the chosen animation using AnimationMixer.
- For independently cloned skinned characters, use skeleton-aware cloning rather than naive scene cloning.
- Prefer one placed character per AR session for the MVP.
- Target a model download below 5 MB where practical; measure actual loading and frame performance.
- Show progress and recoverable errors if an asset fails to load.

### WebXR

- Require HTTPS outside localhost.
- Check navigator.xr and isSessionSupported('immersive-ar').
- Request hit-test when starting the session and handle permission/support failures.
- Offer a visible targeting reticle only while a valid surface hit exists.
- A tap places the character at the current hit pose; no placement if tracking has no valid hit.
- Allow reset/re-place in the same session and an obvious way to exit.
- Request optional features such as DOM overlay only when needed and degrade gracefully.
- In-session anchors may be added if supported, but are not required and do not imply shared persistence.
- On session end, release listeners, hit-test sources, and rendering resources as appropriate.
- Collect location and form data outside immersive AR unless device testing confirms a reliable in-session UI.

Test physical Android Chrome devices with ARCore support. Desktop emulation is not evidence that AR works.

## 11. Repository structure

```text
SPEC.md
README.md
.env.example
.gitignore
package.json
package-lock.json
vite.config.ts
public/
  assets/characters/
src/
  main.ts
  router.ts
  styles.css
  config.ts
  types/
  components/
  pages/
    dashboard.ts
    detail.ts
    create.ts
    sign-in.ts
  services/
    supabase.ts
    assets.ts
    beauticians.ts
    updates.ts
    photos.ts
  rendering/
    model-loader.ts
    preview.ts
    ar-session.ts
supabase/
  migrations/
  seed.sql
tests/
  unit/
  browser/
.github/workflows/
  deploy.yml
```

Keep the data-access layer independent of rendering. AR components receive an asset and record; they do not own database persistence.

## 12. Configuration and deployment

Document these public build-time settings in .env.example:

- VITE_SUPABASE_URL
- VITE_SUPABASE_PUBLISHABLE_KEY
- VITE_MAP_TILE_URL
- VITE_MAP_ATTRIBUTION

Do not commit real .env files. All VITE-prefixed values are public in the built app; never put secrets there.

Configure Vite's base path for the actual GitHub Pages repository subpath. Resolve asset and internal URLs against that base rather than assuming the app is hosted at the domain root.

The deployment workflow must install from the lockfile, run type checks/tests, build, and publish dist through GitHub Pages. Configure Supabase's site URL and allowed authentication redirects for local development and the deployed application.

Choose a map tile provider permitted for the intended traffic. Leaflet does not supply map tiles; attribution and provider terms still apply. Do not assume a public community tile server offers unlimited production capacity.

README must explain Supabase setup, migration application, asset placement, contributor/moderator provisioning, local development, testing, deployment, and known AR limitations.

## 13. Implementation milestones

### M1 — Persistent backbone, without AR

- Project scaffolding, authentication, migrations, and security rules.
- Seed one asset entry.
- Create form, map/list dashboard, detail view, and shared links.
- Optional photo upload and comments.
- Owner/moderator controls and status history.

Acceptance: a record created on one device is visible after reload and from another device. Unauthorized writes are rejected by the database.

### M2 — Animated 3D preview

- Load the project's GLB asset.
- Play its selected animation.
- Handle loading failures and invalid clips.

Acceptance: preview works on desktop and Android without entering AR.

### M3 — Manual AR placement

- Feature detection, session start, hit-test reticle, tap placement, reset, and exit.
- Reuse the preview asset loading/animation code where sensible.

Acceptance: a supported physical Android phone displays the animated character on a detected surface. Unsupported devices retain full map/detail functionality.

### M4 — Integration and deployed pilot

- Reopen saved records and manually place them in AR.
- Verify GitHub Pages base paths, authentication, photos, and deep links.
- Run two-device acceptance tests.

Acceptance: the complete objective in Section 1 passes. No interface claims exact spatial persistence.

## 14. Test checklist

### Automated

- Input lengths, whitespace validation, coordinates, and manual-location behavior.
- Asset/animation selection and missing-clip fallback.
- Hash routing and share-link generation under a repository subpath.
- Loading, empty, and error states.
- Failed save preserves the form; repeated clicks do not duplicate records.
- Rendering of untrusted text is escaped.
- Database tests for public visibility, owner permissions, moderator permissions, role escalation, forged creator IDs, hidden-record comments/photos, and RPC authorization.
- Test writes directly through the API, not merely through UI controls.

### Manual physical-device tests

- Geolocation accepted, refused, unavailable, and inaccurate.
- Camera/AR permission refused and unsupported WebXR.
- Valid AR hit, loss of tracking, reset, and session exit.
- Character animation and mobile load performance.
- Close/reopen the browser: record persists, exact placement does not.
- Phone B opens phone A's link and manually places the same character.
- Public users cannot retrieve hidden records or obtain new photo URLs for them.
- Authentication and direct shared links work on the deployed GitHub Pages URL.

## 15. Instructions for Copilot

1. Read this specification before proposing code.
2. Implement one milestone at a time, starting with M1; do not build AR first.
3. Propose a short implementation plan and flag missing setup inputs.
4. Create migrations and authorization tests alongside data-access code.
5. Keep changes small and reviewable. Run type checks and tests after each milestone.
6. Do not introduce features from the non-goals section.
7. Do not silently replace manual placement with a claim of persistent anchoring.
8. Do not invent supplied assets, credentials, configured services, or successful physical-device tests.
9. Record setup steps, known limitations, and what was actually tested in README.
10. Ask before making major architectural changes or adding paid services.

## 16. Inputs needed from the project owner

- GitHub repository name and intended Pages URL.
- Supabase project URL and publishable key (never a secret/service-role key).
- One animated GLB asset, its clip names, and expected real-world size.
- A map tile provider configuration.
- Initial approved contributor and moderator accounts.
- One or more Android devices available for physical AR testing.

These are configuration dependencies, not reasons to broaden the MVP.
