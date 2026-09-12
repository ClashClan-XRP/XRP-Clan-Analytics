# Site log

Canonical shared snapshot: [`/public/logs/site-log.json`](../public/logs/site-log.json)

The **Site Desk** (`/#/ops`) merges:

1. This committed file (shared baseline in the repo)
2. This browser’s session log (feature use, city, masked IP)
3. GitHub issues labeled `feedback` (suggestion box + bugs)

Suggestions submitted on the board open a GitHub issue so they live on the repository. Full client IPs are not written to this public file — city/country and a masked last-octet IP are.
