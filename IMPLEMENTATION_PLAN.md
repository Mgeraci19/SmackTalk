# SmackTalk Issues Implementation Plan

This plan addresses all issues from `GAMEPLAY_REDESIGN_PLAN.md` with specific file changes and implementation details.

---

## Phase 1: Quick Fixes (Layout & Styling)

### 1.1 Fix Champion Avatar Overlap
**File:** `src/components/host/HostGameResultsView.tsx` (lines 122-150)

**Changes:**
- Increase margin below "CHAMPION" text from `mb-6` to `mb-16`
- Remove or reduce `scale-110` transform on avatar container
- Add responsive sizing adjustments

**Estimated Impact:** ~5 lines changed

---

### 1.2 Fix Avatar Background (White → Black)
**Files:**
- `src/hooks/useFabricCanvas.ts` (line 49)
- `src/components/avatar/DefaultAvatarGallery.tsx` (line 35)

**Changes:**
1. Change canvas `backgroundColor` from `#ffffff` to `#000000`
2. Update DefaultAvatarGallery `bg-white` to `bg-black`
3. Consider updating border colors in:
   - `src/components/game/LobbyView.tsx` (line 71)
   - `src/components/host/HostLobbyView.tsx` (line 65)
   - `src/components/host/FighterHealthBar.tsx` (line 80)

**Estimated Impact:** ~6 lines changed

---

## Phase 2: UI Enhancements

### 2.1 Add Game Rules to Lobby Screens
**Files:**
- `src/components/host/HostLobbyView.tsx`
- `src/components/game/LobbyView.tsx`

**Changes:**
Add collapsible/expandable rules section with:
```
🎮 HOW TO PLAY

ROUND 1 - MAIN ROUND
• 5 prompts per matchup
• Win 3 votes = Fill special bar = KO your opponent
• HP determines seeding (doesn't kill)

ROUND 2 - SEMI-FINALS
• Top 4 fighters advance
• Single-word JAB answers only
• First to 3 wins = KO

ROUND 3 - FINAL SHOWDOWN
• Choose attack type: Jab (1x), Haymaker (2x), Flying Kick (3x/4x)
• 3 consecutive wins = FINISHER KO
• Last fighter standing wins!
```

**Estimated Impact:** ~40 lines added per file

---

### 2.2 Add Round Rules to Transitions
**File:** `src/components/host/RoundTransition.tsx`

**Changes:**
Add round-specific rule hints below subtitle:
- Round 1: "First to 3 wins triggers KO!"
- Round 2: "Single-word JABS only - 4 fighters remain"
- Round 3: "Choose your attack wisely - risk vs reward!"

**Estimated Impact:** ~15 lines changed

---

## Phase 3: Animation Fixes

### 3.1 Special Bar Full Animation (Round 1)
**File:** `src/components/host/FighterHealthBar.tsx` (lines 94-126)

**Changes:**
1. Add `useEffect` to detect when `specialBar >= 3.0`
2. Add GSAP shake animation on the special bar container
3. Add pulsing glow effect on filled segments
4. Sequence: Fill → Shake → "KO!" label → KO animation

**Implementation:**
```typescript
useEffect(() => {
  if (specialBar >= SPECIAL_BAR_TRIGGER) {
    // Shake the special bar container
    gsap.to(specialBarRef.current, {
      x: "+=5",
      duration: 0.05,
      repeat: 10,
      yoyo: true,
      ease: "power2.inOut"
    });
    // Add glow effect
    gsap.to(segmentRefs.current, {
      boxShadow: "0 0 20px rgba(255, 0, 0, 0.8)",
      duration: 0.3,
      repeat: 3,
      yoyo: true
    });
  }
}, [specialBar]);
```

**Estimated Impact:** ~30 lines added

---

### 3.2 Round 2 KO Animation Fix
**Files:**
- `src/components/host/animations/AnimationOrchestrator.tsx`
- `src/components/host/VotingBattle.tsx` (or equivalent)

**Investigation Needed:**
1. Verify animation orchestrator detects Semi-Finals KO condition
2. Check if `attackKOAnimation` is being called when `specialBar >= 3.0`
3. May need to add explicit Semi-Finals animation trigger

**Changes:**
- Ensure Round 2 properly triggers `attackKOAnimation` when special bar fills
- Add round-specific animation selection logic if missing

**Estimated Impact:** ~20 lines changed

---

### 3.3 Enhanced Final Round Attack Display
**Files:**
- `src/components/host/battle/BattleLayout.tsx` (lines 16-54)
- New file: `src/components/host/AttackResultDisplay.tsx`

**Current Problem:** Attack type badges are too small and don't show success/failure

**New Component Design:**
```typescript
// AttackResultDisplay.tsx
interface AttackResultDisplayProps {
  attackType: "jab" | "haymaker" | "flyingKick";
  isWinner: boolean;
  multiplier: number;
  playerName: string;
  side: "left" | "right";
}

// Display structure:
// [PLAYER NAME]
// ATTEMPTED: FLYING KICK 🦶
// [SUCCEEDED ✓] or [FAILED ✗]
// DAMAGE: 3x
```

**Attack Animation Sequence:**
1. Show both players' attack type choices (large, animated)
2. Play attack-specific animation (flying kick sprite, haymaker swing, jab punch)
3. Reveal winner with "SUCCEEDED" / "FAILED"
4. Show calculated multiplier: `max(winner.dealt, loser.received)`
5. Apply damage with visual effect

**Implementation Steps:**
1. Create `AttackResultDisplay.tsx` component
2. Add attack-specific animations to `attacks.ts`
3. Update battle result display to use new component
4. Scale up all text and icons for visibility

**Estimated Impact:** ~150 lines (new component + animation updates)

---

## Phase 4: Bug Fixes

### 4.1 Fix Health Healing Bug (Round 1)
**File:** `convex/lib/gameLogic.ts`

**Root Cause Analysis:**
- Line 161: `if (loser.player.knockedOut)` triggers post-KO handling for all rounds
- Line 436: `handlePostKOHealing` guards with `if (currentRound !== 1)` but may have edge cases

**Changes:**
1. Move round check earlier to line 161:
```typescript
// Only handle post-KO healing in Round 1
if (loser.player.knockedOut && currentRound === 1) {
  await handlePostKOHealing(...);
} else if (loser.player.knockedOut) {
  console.log(`[POST-KO] Round ${currentRound}: Skipping (not Main Round)`);
  return; // or continue without healing
}
```

2. Add explicit logging to track healing:
```typescript
console.log(`[HEALING DEBUG] Round: ${currentRound}, Winner: ${winner.player.name},
  Before HP: ${winner.player.hp}, Healing: ${healAmount}`);
```

3. Verify Semi-Finals (Round 2) bragging round handling (lines 276-290)

**Testing:**
- Add backend test case for no-healing in Rounds 2 & 3
- Verify healing only occurs in Round 1 post-KO scenarios

**Estimated Impact:** ~15 lines changed + 1 new test

---

## Implementation Order

| Priority | Task | Phase | Est. Lines | Risk |
|----------|------|-------|------------|------|
| 1 | Health Healing Bug | 4.1 | 15 | High (breaks gameplay) |
| 2 | Champion Avatar Overlap | 1.1 | 5 | Low |
| 3 | Avatar Background | 1.2 | 6 | Low |
| 4 | Round 2 KO Animation | 3.2 | 20 | Medium |
| 5 | Special Bar Animation | 3.1 | 30 | Medium |
| 6 | Game Rules (Lobby) | 2.1 | 80 | Low |
| 7 | Round Transition Rules | 2.2 | 15 | Low |
| 8 | Final Attack Display | 3.3 | 150 | Medium |

---

## Testing Checklist

After implementation, verify:

- [ ] **Global:** Rules visible in lobby (host + player)
- [ ] **Global:** Avatars render on black background
- [ ] **Round 1:** Special bar shakes when full before KO
- [ ] **Round 1:** No healing occurs after KO in Rounds 2/3
- [ ] **Round 2:** KO animation plays when special bar fills
- [ ] **Round 3:** Attack types clearly visible with SUCCEEDED/FAILED
- [ ] **Round 3:** Multiplier prominently displayed
- [ ] **Results:** Champion avatar doesn't overlap text

---

## Files Modified Summary

| File | Changes |
|------|---------|
| `convex/lib/gameLogic.ts` | Healing bug fix |
| `src/hooks/useFabricCanvas.ts` | Background color |
| `src/components/avatar/DefaultAvatarGallery.tsx` | Background color |
| `src/components/game/LobbyView.tsx` | Game rules, avatar styling |
| `src/components/host/HostLobbyView.tsx` | Game rules, avatar styling |
| `src/components/host/HostGameResultsView.tsx` | Champion layout fix |
| `src/components/host/RoundTransition.tsx` | Round-specific rules |
| `src/components/host/FighterHealthBar.tsx` | Special bar animation |
| `src/components/host/battle/BattleLayout.tsx` | Attack display updates |
| `src/components/host/animations/AnimationOrchestrator.tsx` | Round 2 KO fix |
| `src/components/host/AttackResultDisplay.tsx` | NEW: Attack result UI |

---

## Not In Scope (Future Improvements)

Per GAMEPLAY_REDESIGN_PLAN.md, these are noted but not planned:
- Bot answer quality improvements
- Additional prompts in database
- Sound effects for attack types
