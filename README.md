# warung-senja-kopi-rush

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/arf93/warung-senja-kopi-rush/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/arf93/warung-senja-kopi-rush/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

WARUNG SENJA - Kopi Rush is an original Indonesian warung time-management arcade game: serve kopi tubruk, teh manis, gorengan and nasi kucing to sunset customers before their patience runs out, keep your combo alive, and hit the coin target every shift.

## Run it

```sh
cd game && python3 -m http.server 8000
```

Then open http://127.0.0.1:8000/ in a desktop browser. No build step, no network requests: the whole game is static files under `game/`.

## How to play

- Click a customer, then click the menu item they ordered — or pick a customer with `←` `→` and serve with keys `1`–`4`.
- Menu: Kopi Tubruk 30 · Teh Manis 20 · Gorengan 25 · Nasi Kucing 35 coins.
- Serving in a row builds a combo up to x3. A wrong dish resets the combo.
- 3 shifts with coin targets 500 / 750 / 1000. You lose if 5 customers walk out angry.
- `Space` start · `P` pause · `M` sound · `R` restart.

---

<sub>Entered on [make.fun](https://make.fun/?ref=m7ap5y09&utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>
