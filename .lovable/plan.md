# Fix: business hours never appear on the public profile

## What I found

- No studio in the database has any business hours stored at all (`hours` is empty for every row), and no studio record has been updated since 20 August — before the hours editor existed. So the hours are not failing to *display*; they are failing to *save*.
- The public profile code that renders hours looks correct and does read the `hours` field, so it should show hours as soon as a record actually has them.
- Root cause of the failed save is not yet confirmed. The two realistic candidates are: the update matches zero rows (the dashboard still shows "Listing updated" even when nothing was written), or the save request is rejected by input validation and the error is swallowed.

## Plan

1. **Confirm the cause first.** Run the dashboard save end-to-end against a test studio and inspect what the server receives and how many rows it writes. Fix whichever of the two causes it turns out to be.
2. **Stop silent success.** Make the listing update report how many rows it changed and raise a clear error when nothing was written, so the dashboard shows a real failure message instead of "Listing updated".
3. **Make sure hours are written.** Ensure the weekday hours payload is accepted by the save endpoint and stored on the studio record.
4. **Verify publicly.** After a successful save, load that studio's public profile and confirm the "Business hours" block renders with today's day highlighted.

## Technical notes

- `src/lib/owner.functions.ts` → `updateMyListing`: request the affected rows back from the update (`.select("place_id")`), throw a friendly error when the result is empty, and double-check the `hours` entry in the input schema accepts the `{ mon: { closed, open, close } … }` shape sent by the editor.
- Note the row-level policy on studios only allows an owner update when `business_status = 'OPERATIONAL'`; if a test studio has another status the write is silently dropped. Step 1 will confirm whether that is what is happening, and if so the fix is to relax that condition to allow owner edits on their own listing regardless of status.
- `src/components/listing-manager.tsx`: no structural change expected; only error surfacing if the save now throws.
- No public-page changes expected unless verification shows a rendering issue.
