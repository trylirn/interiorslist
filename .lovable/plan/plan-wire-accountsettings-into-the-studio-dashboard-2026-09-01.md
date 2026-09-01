# Plan: Wire AccountSettings into the studio dashboard

## Goal
Replace the old inline `CloseAccount` component in `src/routes/_site.dashboard.tsx` with the new `<AccountSettings>` component, remove the now-dead code, and confirm it all compiles.

## Context (verified from current files)
- `src/components/account-settings.tsx` already exports `AccountSettings({ email, canClose })`, which renders the profile editor, a sign-out card, and the multi-step `CloseAccountWizard` (reason → details → missing features/likelihood → DELETE confirm). It calls `deleteMyAccount` with `{ reason, details, missingFeatures, wouldReturn }`.
- `src/lib/user-actions.functions.ts` already exposes `deleteMyAccount` accepting those exit-survey fields and recording them into `account_closure_feedback` before deleting the user.
- `src/routes/_site.dashboard.tsx` still contains the legacy `CloseAccount` function (lines 135–184) and two usages:
  1. No-listings branch — line 68–69: `{active === "settings" && !roles?.isSuperAdmin ? (<CloseAccount />) : (...)}`.
  2. Main settings branch — lines 125–127: `{active === "settings" && (roles?.isSuperAdmin ? <p>…</p> : <CloseAccount />)}`.

## Changes

### 1. `src/routes/_site.dashboard.tsx`
- Add import: `import { AccountSettings } from "@/components/account-settings";`
- Remove the now-unused import `deleteMyAccount` from `@/lib/user-actions.functions` (only `CloseAccount` used it; no other reference remains).
  - `Textarea`, `useServerFn`, `Star`, `toast`, `supabase` stay — still used by `ReviewsTab`/session logic.
- No-listings branch: replace
  ```tsx
  {active === "settings" && !roles?.isSuperAdmin ? (
    <CloseAccount />
  ) : (
    <> ... </>
  )}
  ```
  with `<AccountSettings email={email} canClose={!roles?.isSuperAdmin} />` rendered when `active === "settings"`, else the existing empty-state + Claims block.
- Main settings branch: replace
  ```tsx
  {active === "settings" && (roles?.isSuperAdmin
    ? <p className="text-sm text-muted-foreground">Super admin accounts can't be closed from the dashboard.</p>
    : <CloseAccount />)}
  ```
  with
  ```tsx
  {active === "settings" && <AccountSettings email={email} canClose={!roles?.isSuperAdmin} />}
  ```
  (`AccountSettings` already handles the super-admin case with `canClose={false}`.)
- Delete the entire `CloseAccount` function (current lines 135–184) plus the trailing blank lines.

### 2. Verify build
- Run `bunx tsgo --noEmit` — expect zero errors.
- Run `bun run build` — expect success.

## Out of scope
- No backend changes (`user-actions.functions.ts` is complete).
- No changes to `account-settings.tsx`.
