# 🗡️ ChoreQuest: Slayer of the Backlog

> **Hackathon Problem Statement Alignment:**  
> *"We all procrastinate on painful digital chores — cleaning out 5000 unread emails, sorting messy folders, reviewing expenses, or fixing lint errors. Build an experience where playing a fast-paced game or interactive story actually executes the real-world chore in the background."*

ChoreQuest turns painful digital chores into a retro 2D top-down action RPG (Zelda-style). When you slash a **Spam Slime**, shoot a **Lint Banshee**, or sort a **Receipt Mimic**, an asynchronous backend worker invokes the real API in the background (Gmail API, GitHub API, Expense DB) with **sub-16ms optimistic UI updates**, **debounced batching**, and a **graceful rollback mechanism**.

---

## 🎮 Core Game Mechanics & Real Chore Mapping

| Chore Enemy | In-Game Encounter | Real-World API Execution |
| :--- | :--- | :--- |
| **Spam Slime** | Green acidic slime formed from newsletters | Calls `Gmail API` (`users.messages.trash` or `batchModify`) to remove `INBOX` label. |
| **Lint Banshee** | Ghostly specter carrying broken AST branches | Calls `GitHub API` or triggers automated lint workflow (`eslint --fix`). |
| **Receipt Mimic** | Chest spitting unfiled coffee and travel expenses | Categorizes transaction and syncs to Google Sheets / Notion Database. |

---

## 🏛️ System Architecture

```
┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│     Phaser 3 Game Viewport      │       │    Tactical Fallback Console    │
│  - 60 FPS Canvas Arcade Physics │◄─────►│  - WCAG AAA Accessible Panel    │
│  - Instant Slash Hitbox Juice   │       │  - Full Keyboard Nav (J/K/Enter)│
└────────────────┬────────────────┘       └────────────────┬────────────────┘
                 │                                         │
                 └───────────────────┬─────────────────────┘
                                     │
                                     ▼
                   ┌───────────────────────────────────┐
                   │    Optimistic State Store         │
                   │    (Sub-16ms feedback + Rollback) │
                   └─────────────────┬─────────────────┘
                                     │ HTTPS
                                     ▼
                   ┌───────────────────────────────────┐
                   │   Express BFF (Backend-For-Front) │
                   │  - OAuth Token Vault & PKCE       │
                   │  - Idempotent Async Task Queue    │
                   │  - Scope Minimization             │
                   └─────────────────┬─────────────────┘
                                     │
           ┌─────────────────────────┼─────────────────────────┐
           ▼                         ▼                         ▼
   [ Gmail Adapter ]        [ GitHub Adapter ]         [ Mock Adapter ]
 (gmail.modify scope)     (repo / workflow scope)   (Zero-Auth Sandbox)
```

---

## 🔒 Security Architecture

1. **Backend-For-Frontend (BFF) Pattern**: Client-side code **never receives, handles, or stores** OAuth refresh or access tokens.
2. **Scope Minimization**: Requests only least-privilege scopes (`https://www.googleapis.com/auth/gmail.modify` instead of `mail.google.com`).
3. **Out-of-the-Box Evaluator Sandbox**: By default, `DEMO_MODE=true` is enabled, letting evaluators test the full end-to-end loop (including realistic simulated latencies and rollback mechanics) with zero OAuth setup required.

---

## ⚡ Performance & Efficiency

- **Sub-16ms Optimistic UI**: Enemies play death animations, particle explosions, and drop XP immediately upon sword contact.
- **Idempotent Queue & Debouncing**: Multi-kills within a 1.5s window are aggregated into a single batch API call (`users.messages.batchModify`) to prevent API rate limits.
- **Necromancy Rollback**: If the server fails after 3 retries, the enemy is resurrected with a notification banner, ensuring client and backend states stay in sync.

---

## ♿ Accessibility & Inclusivity

- **Tactical Fallback Console**: A side-by-side keyboard-navigable terminal designed for screen readers (`aria-live="polite"`).
- **Zero-Motion Mode**: High-contrast mode toggle (`Alt+C`) and screen-shake disable toggle (`prefers-reduced-motion`).
- **Turn-based controls**: Press `J`/`K` or `ArrowDown`/`ArrowUp` to target enemies and `Enter` to execute.

---

## 🚀 Quickstart Guide

### 1. Prerequisites
Ensure you have **Node.js (v18+)** and **npm** installed.

### 2. Setup & Installation
```bash
# Clone the repository
git clone https://github.com/your-username/chorequest.git
cd chorequest

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 3. Run Development Servers
Open two terminal windows:

**Terminal 1 (Backend BFF on port 4000):**
```bash
cd server
npm run dev
```

**Terminal 2 (Frontend Client on port 5173):**
```bash
cd client
npm run dev
```

Visit **`http://localhost:5173`** in your browser.

---

## 📁 Repository Structure

```
ai_project/
├── shared/
│   └── types.ts                 # Shared TypeScript contracts (ChoreItem, ActionPayload)
├── server/
│   ├── src/
│   │   ├── server.ts            # Express server with security headers & rate limiting
│   │   ├── config.ts            # Configuration and OAuth scopes
│   │   ├── queue/
│   │   │   └── choreQueue.ts    # Idempotent async queue with debounce & backoff
│   │   ├── adapters/
│   │   │   ├── types.ts         # IChoreAdapter interface
│   │   │   ├── mockAdapter.ts   # High-fidelity demo sandbox
│   │   │   ├── gmailAdapter.ts  # Real Gmail API adapter
│   │   │   └── githubAdapter.ts # Real GitHub API adapter
│   │   └── routes/
│   │       ├── auth.routes.ts   # OAuth endpoints
│   │       └── chore.routes.ts  # Chore execution endpoints
├── client/
│   ├── src/
│   │   ├── store/
│   │   │   └── choreStore.ts    # Zustand optimistic store & rollback engine
│   │   ├── game/
│   │   │   ├── config.ts        # Phaser 3 configuration
│   │   │   ├── GameContainer.tsx# React wrapper bridging canvas
│   │   │   └── scenes/
│   │   │       ├── BootScene.ts # Procedural pixel art generation (Zero 404s!)
│   │   │       └── DungeonScene.ts # Top-down Zelda movement, slashing, & particles
│   │   └── components/
│   │       ├── Header.tsx       # Stats, contrast & motion toggles
│   │       ├── TacticalConsole.tsx # Accessible ARIA fallback dashboard
│   │       └── SyncStatusToast.tsx # Real-time background sync feedback
```
