# SmackTalk

A multiplayer battle-of-wits party game where players compete in verbal sparring matches. Answer prompts creatively, vote on the best answers, and knock out your opponents in this Jackbox-style elimination game.

## Game Overview

SmackTalk is a 3-round elimination game for 8-12 players.

### Round 1: Main Round
- Players are paired for 1v1 matchups with 5 prompts each
- Win prompts to build your **special bar** (+1 per win)
- First to 3 wins triggers instant KO (HP cannot kill)
- Damage is applied (0.5x multiplier) but only affects seeding
- After KO, remaining prompts still play for healing opportunities
- Losers become Corner Men for their opponents

### The Cut
- All fighters ranked by HP
- Top 4 advance to Semi-Finals
- Remaining players become Corner Men assigned to semifinalists

### Round 2: Semi-Finals
- 4 fighters in 2 bracket matches (#1 vs #4, #2 vs #3)
- No HP damage - special bar only
- **Jab prompts** (1-3): Single word answers, +1 special bar on win
- **Haymaker prompt** (4): Bragging round, plays even after KO
- First to 3.0 special bar = KO
- Winners advance to Final

### Round 3: Final Showdown
- 2 finalists start with 200 HP each
- Prompts continue until someone is knocked out
- **Attack Types** (chosen secretly):
  - Jab: 1x damage dealt / 1x received
  - Haymaker: 2x dealt / 2x received
  - Flying Kick: 3x dealt / 4x received
- Loser takes the higher multiplier between winner's dealt and loser's received
- 3 consecutive wins = instant FINISHER KO (resets on loss)

### Corner Man System
- Eliminated players support their assigned captain
- Can send answer suggestions
- Human corner men can control bot captains

---

## Live Demo

Play at: https://mgeraci19.github.io/SmackTalk/

---

## Tech Stack

- **Frontend**: Next.js 16 (React 19) with TypeScript
- **Backend**: Convex (real-time database and serverless functions)
- **Styling**: Tailwind CSS
- **Animation**: GSAP
- **Deployment**: GitHub Pages (static export)

---

## Architecture

### Frontend (`src/`)
- `app/page.tsx` - Home page for creating/joining games
- `app/room/page.tsx` - Player mobile view with phase routing
- `app/host/page.tsx` - Host TV display with animations
- `components/game/` - Player-facing components
- `components/host/` - Host display components and battle animations

### Backend (`convex/`)
- `lobby.ts` - Game creation, joining, and starting
- `engine.ts` - Core game loop (damage, elimination, round progression)
- `actions.ts` - Player actions (submit answers, vote, suggestions)
- `bots.ts` - AI players for testing and filling lobbies
- `lib/phases.ts` - Round setup and matchmaking logic
- `lib/gameLogic.ts` - Damage calculation, special bar, attack resolution

---

## Local Development

### Prerequisites
- Node.js 20+
- npm

### Setup

1. Clone the repository
   ```bash
   git clone https://github.com/Mgeraci19/SmackTalk.git
   cd SmackTalk
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up Convex
   ```bash
   npx convex dev
   ```
   This creates a `.env.local` file with your Convex deployment URL.

4. Run the development server
   ```bash
   npm run dev
   ```

5. Open the game at http://localhost:3000

---

## Deployment

### GitHub Pages

This project is configured for automatic deployment to GitHub Pages.

1. Set up Convex production deployment
   ```bash
   npx convex deploy
   ```
   Copy the production URL (e.g., `https://your-project.convex.cloud`)

2. Configure GitHub Repository
   - Go to Settings > Secrets and variables > Actions > Variables
   - Add `NEXT_PUBLIC_CONVEX_URL` with your production Convex URL

3. Enable GitHub Pages
   - Go to Settings > Pages
   - Source: GitHub Actions

4. Deploy
   ```bash
   git push origin main
   ```

The GitHub Action automatically builds and deploys on push to `main`.

---

## Testing

### Commands
```bash
npm run typecheck    # TypeScript check
npm run lint         # ESLint
npm run test:backend # Convex backend tests
npm run test:frontend # React component tests
```

### Manual Testing
1. Open multiple browser windows
2. Create a game and copy the room code
3. Join from other windows with different names
4. Bots automatically fill empty slots to 8 players

---

## License

MIT

---

## Author

Michael Geraci
