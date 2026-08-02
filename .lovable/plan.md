# Admin provider dashboard, analytics noise, and Google sign-in branding

## 1. Admin view of any provider's dashboard

Today the provider dashboard only loads listings where the signed-in user is the claimed owner, so an admin cannot see or fix a provider's page from the admin console.

What to build:
- New admin tab "Providers" (in the existing Admin console) listing every provider with search, claim status, and a "Open dashboard" action.
- New admin route that renders the exact same dashboard UI providers see (listing editor, leads, reviews, metrics) for the selected provider, with a clear "Viewing as admin" banner.
- Admin edits save through the same flow, so changes made by the team appear identically to the owner.

Technical notes:
- Add admin-scoped server functions (admin role verified server-side) that mirror `getMyListing`, `listMyListings`, `updateMyListing`, `listMyLeads`, `listMyReviews` but resolve by `place_id` instead of `claimed_by`.
- Extract the current dashboard tabs/editor into shared components so the owner route and the admin route render the same code, avoiding drift.
- Route: `/admin/provider/$placeId`, `noindex`, guarded by the existing admin role check.

## 2. The "strange" analytics activity

Checked the data: there are only 16 sessions total since 7 July, and the ones with a recorded user agent/referrer come from the Lovable editor preview (`referrer: lovable.dev`, entry path containing `__lovable_sha`). No bot or crawler user agents are present. This is your own browsing of the preview and published site while building — not attacks or bot traffic.

Fixes so the numbers stay meaningful at launch:
- Do not track when the app runs inside the Lovable editor/preview (iframe or preview hostname) or when the URL carries `__lovable_*` params.
- Skip tracking for known bot/crawler/headless user agents, both client-side and again in the tracking endpoint.
- Skip tracking for signed-in admins (your own visits).
- Record the user agent on every session upsert (right now most sessions store none, which is why nothing looked classifiable) and keep referrer.
- Add an admin control to purge existing pre-launch test analytics so the dashboard starts clean, plus an "exclude internal traffic" note in the dashboard header.

## 3. Google sign-in shows "Lovable"

The consent screen names the app that owns the OAuth client. Right now sign-in uses Lovable's managed Google credentials, so Google shows "Lovable". This is not a code bug and cannot be changed from app code.

To show your own brand you supply your own Google OAuth client:
1. In Google Cloud Console, create an OAuth consent screen with your app name, logo, support email, and your domain as an authorized domain.
2. Create a Web application OAuth client and add the callback URL shown in the backend auth settings for Google.
3. Paste the client ID and secret into the backend Google provider settings (Cloud → Users → Auth settings → Google).
4. Publish the consent screen (Google verification is required before the branded screen shows for all users).

Also worth doing: the callback URL reads nicer on a custom domain, so if a custom domain is planned, set it up before submitting Google verification. No app code changes are needed for this item — I will confirm the current code path uses the managed helper correctly and leave it as is.
