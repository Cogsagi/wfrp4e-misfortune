# ⛧ Misfortune — GM Fortune Pool for WFRP4e

A homebrew metacurrency module for Warhammer Fantasy Roleplay 4th Edition on Foundry VTT.

**When any non-GM player rolls an 88 on a d100 test, the GM accumulates a Misfortune point** — a dark reflection of Fortune that can be spent to reroll any NPC test. The Dark Gods are watching.

![Foundry V13](https://img.shields.io/badge/Foundry-V13-orange)
![WFRP4e v9](https://img.shields.io/badge/WFRP4e-v9.x-darkred)
![License: MIT](https://img.shields.io/badge/License-MIT-blue)

---

## Features

- **Automatic 88 Detection** — Hooks into all WFRP4e roll tests and detects when a player rolls the trigger value (default: 88)
- **GM Role Filtering** — Only non-GM players trigger Misfortune. Gamemaster and Assistant Gamemaster roles are excluded
- **Persistent Pool** — Misfortune points are stored in world settings and persist across sessions
- **Themed UI Tracker** — A dark, grimdark floating widget displays the current Misfortune count. GM gets spend/add/reset controls
- **Dramatic Chat Messages** — Atmospheric, randomised chat messages announce when Misfortune is earned or spent
- **Chat Commands** — `/misfortune` or `/mf` for quick status, spending, and resetting
- **Socket Sync** — Real-time updates across all connected clients
- **Module API** — Exposed functions for macros and other module integrations
- **Configurable** — Adjustable trigger value, player visibility, and chat message toggles

## Installation

### Method 1: Manifest URL
In Foundry VTT, go to **Add-on Modules → Install Module** and paste:
```
https://github.com/cogsagi/wfrp4e-misfortune/releases/latest/download/module.json
```

### Method 2: Manual
1. Download the latest release zip
2. Extract to `{userData}/Data/modules/wfrp4e-misfortune/`
3. Enable the module in your World under **Game Settings → Manage Modules**

## Usage

### Automatic Trigger
When any Player or Trusted Player rolls an **88** on a d100 test, a Misfortune point is automatically added to the GM's pool. A dramatic chat message is posted and the tracker updates in real time.

### GM Controls
The floating tracker widget (bottom-left of screen) provides:
- **☠ Spend** — Use 1 Misfortune point (for NPC rerolls)
- **+** — Manually add 1 Misfortune point
- **↺** — Reset the pool to 0 (with confirmation)

### Chat Commands
| Command | Description |
|---|---|
| `/misfortune` or `/mf` | Show current pool |
| `/mf spend` | (GM) Spend 1 Misfortune point |
| `/mf reset` | (GM) Reset pool to 0 |
| `/mf help` | Show command help |

### Macro / Module API
```javascript
const api = game.modules.get("wfrp4e-misfortune").api;

api.getPool();           // Returns current Misfortune count
api.spendMisfortune();   // Spend 1 point
api.addMisfortune("Player Name", 88);  // Manually add
api.resetPool();         // Reset to 0
```

## Configuration

Found in **Game Settings → Module Settings → Misfortune**:

| Setting | Default | Description |
|---|---|---|
| Show Tracker to Players | ✅ Yes | Whether players can see the Misfortune count (recommended for maximum dread) |
| Trigger Roll Value | 88 | The d100 result that triggers Misfortune |
| Show Dramatic Chat Messages | ✅ Yes | Post thematic messages when Misfortune is earned/spent |

## Role Filtering

The module checks `user.isGM` which returns `true` for both **Gamemaster** and **Assistant Gamemaster** roles in Foundry VTT.

| Role | Triggers Misfortune? |
|---|---|
| Player | ✅ Yes |
| Trusted Player | ✅ Yes |
| None | ✅ Yes |
| Assistant Gamemaster | ❌ No |
| Gamemaster | ❌ No |

## Compatibility

- **Foundry VTT**: V13+
- **WFRP4e System**: v9.0.0+
- Should not conflict with Dice So Nice!, GM Toolkit, or other popular WFRP4e modules

## License

MIT — use it, modify it, share it with your warband.

## Credits

Built with the grim determination of an Empire soldier and the cunning of a Skaven engineer.
