# Loop contract: pull request watcher

## Goal

Keep one release pull request moving without creating unnecessary changes.

## Polling turn

1. Check CI and new review comments.
2. If CI is red, inspect the failing job, reproduce it locally, and make one minimal fix.
3. If comments arrived, address one coherent group and verify the result.
4. If the pull request is green and quiet, report that in one line and make no change.
5. Keep `LOOP_STATE.md` current.

## Limits

- One pull request and one coherent correction at a time.
- Stop when green and approved, after three failed repairs, or when the session closes.
- Never merge or deploy.
- Use `/loop 2m` only for rehearsal. Use a longer interval for a real pull request.

