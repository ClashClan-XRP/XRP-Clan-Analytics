# XRP Clan Analytics

Clash Royale **meta lab**, player scout, clan room, and upgrade planner for [**CryptoClan-$XRP**](https://royaleapi.com/clan/RQ2V9QV9).

**Open the app (share this with clanmates):**  
[https://clashclan-xrp.github.io/](https://clashclan-xrp.github.io/)

Project Pages URL: [https://clashclan-xrp.github.io/XRP-Clan-Analytics/](https://clashclan-xrp.github.io/XRP-Clan-Analytics/)

Source: [github.com/ClashClan-XRP/XRP-Clan-Analytics](https://github.com/ClashClan-XRP/XRP-Clan-Analytics)

If GitHub shows a 404 the first time, open the repo **Settings → Pages**, set **Source** to **GitHub Actions** (or **Deploy from a branch** → `main` / `docs`), then wait a minute and refresh.

## What clanmates can do

| Screen | Use it for |
| --- | --- |
| Home | Season snapshot, top meta decks, jump to your tag |
| Meta | Ladder / 2v2 / war decks, win rates, F2P filter, hottest cards |
| Scout | Any player tag — collection vs meta, deck fit, evo / hero / champion readiness |
| Clan | Roster, war trophies, complementary **2v2 pairings** |
| Upgrades | Gold-budget priority queue (levels + evolutions) |
| Cards | Full encyclopedia with level slider |

Demo data loads instantly (no key required). Live lookups use the [RoyaleAPI proxy](https://docs.royaleapi.com/) in front of the official Clash Royale API.

## How recommendations work

- **Ladder fit** scores a meta deck against *your* card levels, evolutions, heroes, and champions.
- **Upgrade ROI** weights gold-to-next against how often the card appears in current meta decks.
- **2v2 pairing** looks for complementary win conditions, spell diversity, and air coverage across two collections.

Meta snapshot is bundled (September 2026 / Minion Academy season) so the app stays useful if the live API is down.

## Live API (optional)

In **Settings**, paste a token from [developer.clashroyale.com](https://developer.clashroyale.com). Whitelist IP `45.79.218.79` (RoyaleAPI proxy). Default clan tag is `#RQ2V9QV9`. Default scout tag is `#8Q8U9JLJL`.

## Run from source

```bash
npm install
npm run dev
```

Not affiliated with Supercell. Clash Royale is a trademark of Supercell.
