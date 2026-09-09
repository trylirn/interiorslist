# Fix sign-in code length and flaky "send link" clicks

## 1. Sign-in code accepts the code we actually email

The email shows the code exactly as the login system generates it, and that code is 8 digits. The sign-in form only accepts 6 digits, so the real code can never be entered.

Fix: the code box accepts 6 to 8 digits, the button unlocks once at least 6 are entered, and the label/placeholder stop saying "6-digit". The code is passed through to verification as typed.

Also check the login setting that controls code length: if it can be set to 6, we set it to 6 so link and code stay consistent; otherwise the form simply accepts the longer code.

## 2. "Email me a sign-in link" needing several clicks

Delivery history shows recent sends succeeding, and several pairs of sends about a minute apart to the same address — the pattern of a first click that failed and a second that worked. The exact cause is not confirmed yet, so the first step is to look at the sign-in service logs right after a failed click and confirm which of these it is:

- the email service being slow to wake up on the first request, so the first attempt times out
- the hourly cap on sign-in emails returning an error
- a click landing before the previous one finished

Then apply the matching fix:

- Timeout/transient failure: retry the send once automatically before showing an error, so a slow first attempt is invisible to the user.
- Hourly cap: raise the sign-in email limit to match real volume, and show a clear "too many requests, try again shortly" message instead of a generic error.
- Double submit: block repeat submits while a send is in flight and show the exact error text returned rather than failing silently.

In all cases the button shows a clear sending state, and any failure shows a specific message plus a working "try again".

## Technical notes

- `src/routes/_site.login.tsx`: relax the code input to `maxLength={8}`, validate `length >= 6 && <= 8`, update copy, guard `sendLink` against concurrent submits, add one automatic retry with a short backoff, and surface the Supabase error code (e.g. `over_email_send_rate_limit`) in the toast.
- Inspect auth/webhook logs to confirm the failure mode before choosing the retry vs. rate-limit path; if it is the cap, call `supabase--configure_auth` with a higher `rate_limit_email_sent`.
- Check whether the project's OTP length can be set to 6; if not, keep the 6–8 digit input.
- Finish with a typecheck and production build.
