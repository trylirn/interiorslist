# New accounts land in the right place

## What's wrong

Isaac signed in successfully, but the account was created with **no roles at all** — not even a basic account record. The set-up routine that is supposed to run the moment someone signs up (create their profile, give them a role, and apply any admin invitation) exists but was never actually attached to the sign-up event. So it has never run for anyone.

Because Isaac has no admin role, the site treats him as a studio owner and shows the "Finish setting up your studio profile" screen instead of the admin dashboard.

The same gap affects studio owners: a brand-new account with a claim still awaiting approval sees the same "You don't manage any listings yet" prompt, with no sign that their claim was received.

## What will change

1. **Attach the account set-up routine to sign-up** so every new account instantly gets its profile, its basic role, and — for invited addresses — admin or super admin. Existing accounts created while it was missing get the same treatment retroactively.
2. **Grant Isaac admin + super admin now** so he goes straight to the admin dashboard on his next visit, and record the invitation so it is visible in the admin team list.
3. **Admins never see the studio set-up screen.** While the account's roles are still loading, show a neutral loading state and then send admins to the admin dashboard — no flash of the studio prompt.
4. **Studio owners with a claim under review** see a "Claim under review" panel naming the studio they claimed, when it was submitted, and what happens next — instead of the "you don't manage any listings yet" empty state and the setup banner. Once approved, they land on their studio dashboard as usual.
5. Owners with no claim and no listing keep the current "find or submit your business" screen.

## Technical notes

- Migration: `CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user()` (function already exists and handles profile, `user`, hardcoded super admins, and `admin_invites`). Follow with a backfill for existing `auth.users` rows missing `profiles` / `user_roles` entries, plus an `admin_invites` row for `isaac@intearior.com`.
- `src/routes/_site.dashboard.tsx`: gate rendering on `getMyRoles` resolving (not just session ready) before showing the owner empty state; keep the redirect to `/admin`.
- Same file: use `listMyClaims` (already imported) to detect a pending/under-review claim and render a status panel; hide the onboarding banner in that case.
- No changes to `_site.admin.tsx`, claim approval logic, or RLS.
