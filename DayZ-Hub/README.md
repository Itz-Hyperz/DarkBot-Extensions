# DayZ Hub — Dark-Bot Extension

Multi-guild DayZ server status panel + basic BattlEye RCON for Dark-Bot.

One bot instance can serve many Discord servers. Each Discord stores its own DayZ server settings.

---

## Features

| Feature | Description |
|---------|-------------|
| Live status panel | Auto-updating embed (players, map, online/offline) |
| `/dayz status` | On-demand server status |
| `/dayz players` | Player list via query protocol |
| `/dayz setup` | Configure IP, ports, RCON (Admin) |
| `/dayz panel` | Post the live status embed (Admin) |
| `/dayz rcon` | Live player list via BattlEye RCON (Admin) |
| `/dayz say` | Broadcast a message in-game (Admin) |
| `/dayz kick` | Kick a player by RCON number (Admin) |

---

## Requirements

- Working **Dark-Bot** install (self-hosted VPS + MySQL)
- Node.js (same version Dark-Bot uses, typically 16+)
- DayZ **query port** reachable from your VPS
- (Optional) DayZ **BattlEye RCON** port + password for kick/say

---

## Install Guide

### 1. Copy the extension

Place the entire `DayZ-Hub` folder here:

```
Dark-Bot/src/extensions/DayZ-Hub/
├── extension.json
├── main.js
└── README.md
```

### 2. Install dependencies

From the **Dark-Bot root** folder run:

```bash
npm install gamedig battle-node
```

### 3. Restart Dark-Bot

```bash
# Linux example
node .

# or however you normally start it (CLIENT.bat / screen / pm2)
```

You should see in the console:

```
[DayZ Hub] Extension loading...
[DayZ Hub] Database table ready
[DayZ Hub] Slash commands registered
[DayZ Hub] Status updater started (every 3 minutes)
```

### 4. Configure a Discord server

In any Discord the bot is in, an **Administrator** runs:

```
/dayz setup
  ip: 123.45.67.89
  queryport: 2303
  name: My DayZ Server
  gameport: 2302
  rconport: 2305
  rconpassword: your_rcon_password
```

| Option | Required | Notes |
|--------|----------|-------|
| `ip` | Yes | Server IP or hostname |
| `queryport` | Yes | Query port (often game port + 1) |
| `name` | No | Display name |
| `gameport` | No | Shown in the connect string |
| `rconport` | No | BattlEye RCON port |
| `rconpassword` | No | BattlEye RCON password |
| `channel` | No | Optional default status channel |

### 5. Create the live status panel

```
/dayz panel channel:#server-status
```

The bot posts an embed that refreshes every ~3 minutes.

---

## Finding your ports

### Query port
DayZ uses the Source query protocol. Common values:

- Game port + 1  
- Or the port set in your host panel / `serverDZ.cfg`

Test it:

```bash
npx gamedig --type dayz --host YOUR_IP --port YOUR_QUERY_PORT
```

### RCON port
Found in your BattlEye config, usually:

```
profiles/BattlEye/BEServer_x64.cfg
```

Example:

```
RConPassword your_password_here
RConPort 2305
RestrictRCon 0
```

The RCON port must be open to your VPS IP.

---

## Commands overview

| Command | Who | What it does |
|---------|-----|----------------|
| `/dayz status` | Everyone | Show current status |
| `/dayz players` | Everyone | List players (query) |
| `/dayz setup` | Admin | Save server settings |
| `/dayz panel` | Admin | Post live status embed |
| `/dayz rcon` | Admin | Player list via RCON (with numbers) |
| `/dayz say <message>` | Admin | In-game broadcast |
| `/dayz kick <number> [reason]` | Admin | Kick player by RCON number |

Workflow for kicks:
1. `/dayz rcon` → get the player list with numbers  
2. `/dayz kick number:3 reason:Rule break`

---

## Security notes

- RCON passwords are stored in your MySQL database in plain text. Protect the database and only give Administrator permission to trusted staff.
- Prefer a strong unique RCON password.
- Restrict RCON port access with a firewall if possible (allow only your VPS IP).

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Extension not loading | Check folder is `src/extensions/DayZ-Hub` and contains `extension.json` |
| Commands missing | Restart the bot; wait ~1 minute for global command sync |
| Status always offline | Wrong query port, or port blocked by firewall |
| RCON login failed | Wrong port/password, or RCON port not reachable from VPS |
| `gamedig` / `battle-node` errors | Run `npm install gamedig battle-node` from Dark-Bot root |

---

## Multi-server use

This extension is multi-guild by design:

1. Invite the same Dark-Bot to many DayZ Discords  
2. Each Discord runs its own `/dayz setup`  
3. Settings and status panels stay completely separate  

You host one bot instance; communities just invite it.

---

## License / Credits

Built as a community extension for [Dark-Bot](https://github.com/Itz-Hyperz/Dark-Bot) by Itz-Hyperz.  
Uses `gamedig` for server queries and `battle-node` for BattlEye RCON.
