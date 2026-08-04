# Approved plan + super admin role management

The previously approved work stands as-is:

1. **Claim a profile without signing in** — new `/claim` entry page (paste URL or search by name) leading to a Sam's List-style form on `/claim/{slug}`: first name, last name, email, phone, position, reason. Confirmation keeps the "we'll reach out shortly, $50/month" message. Writes go through a trusted server function with validation and throttling — no anonymous database write access.
2. **Multi-step review wizard** — dedicated `/review` (and `/review/{slug}`) page with a 1-2-3-4 progress bar: find the provider, your experience, ratings & conflict disclosures, about you. Sign-in still required at submit.
3. **Fix "Open my dashboard" in Admin** — `/admin` has child routes but never renders the child outlet, so the URL changes and nothing appears. Render the outlet for child routes, tabs otherwise.
4. **Remove the Maps tab from Admin** — geocoding server functions stay; provider pages still geocode on demand.

## 5. Super admin and admin management (new)

`nokunato@gmail.com` becomes the site's super admin, and gets a **Team** tab in `/admin` to manage who else has access.

What the super admin can do:

- See every person who currently has admin access, with their email, role, and when access was granted.
- **Grant admin access by email.** If the person already has an account, the role applies immediately. If not, the invite is recorded and applies automatically the moment they sign up with that email.
- **Revoke admin access** from anyone except themselves.
- Optionally promote someone to super admin (they can then manage the team too).

Rules enforced on the server, not just in the UI:

- Only a super admin can grant or revoke roles. A regular admin sees the Team tab as read-only.
- Nobody can change their own role or remove the last remaining super admin.
- A regular admin keeps everything they have today: analytics, claims, submissions, listings, the sandbox dashboard.

## Technical notes

- Add `super_admin` to the `app_role` enum; keep `admin` as the everyday privilege level so existing checks keep working. Seed the super admin row for `nokunato@gmail.com`, and update the signup trigger so that address (and any pending invite) receives its roles on account creation.
- New `admin_invites` table (email, role, invited_by, timestamps) with grants and RLS restricted to admins; the signup trigger consumes matching invites.
- New server functions in `src/lib/role.functions.ts`: `listAdmins`, `grantRole`, `revokeRole` — each re-checks the caller's super-admin status through `has_role` before touching anything, with the last-super-admin and self-modification guards.
- `getMyRoles` returns `isSuperAdmin` alongside `isAdmin`; `/admin` gains a Team tab rendering the list and the grant form.
- Extra review fields and the claim contact-name column are already in place from the approved plan's migration.
