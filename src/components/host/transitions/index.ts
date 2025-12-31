/**
 * Transitions Module
 *
 * Decoupled, hot-swappable game transitions using registry pattern.
 *
 * Usage:
 * ```tsx
 * import { TransitionOrchestrator } from "@/components/host/transitions";
 *
 * <TransitionOrchestrator gameState={game} />
 * ```
 */

// Core exports
export { TransitionOrchestrator } from "./TransitionOrchestrator";
export { transitionRegistry } from "./transitionRegistry";
export * from "./types";

// Transition components
export { RoundStartTransition } from "./RoundStartTransition";
export { SuddenDeathIntro } from "./SuddenDeathIntro";
export { CornerMenReveal } from "./CornerMenReveal";

// Auto-register built-in transitions
import { transitionRegistry } from "./transitionRegistry";
import { RoundStartTransition } from "./RoundStartTransition";
import { SuddenDeathIntro } from "./SuddenDeathIntro";
import { CornerMenReveal } from "./CornerMenReveal";

/**
 * Register the sudden death intro transition
 * Triggers when entering Round 4 (higher priority than generic round start)
 */
transitionRegistry.register({
  id: "sudden-death-intro",
  name: "Sudden Death Intro",
  trigger: (prevState, currentState) => {
    // Only trigger when transitioning TO round 4 (not initial load)
    return (
      prevState !== null &&
      prevState.currentRound === 3 &&
      currentState.currentRound === 4
    );
  },
  priority: 20, // Higher priority than generic round start
  component: SuddenDeathIntro,
});

/**
 * Register the round robin reveal transition
 * Triggers when entering Round 3 - shows remaining captains
 */
transitionRegistry.register({
  id: "round-robin-reveal",
  name: "Round Robin Reveal",
  trigger: (prevState, currentState) => {
    // Only trigger when transitioning TO round 3 (not initial load)
    return (
      prevState !== null &&
      prevState.currentRound === 2 &&
      currentState.currentRound === 3
    );
  },
  priority: 16, // High priority for round 3 transition
  component: CornerMenReveal,
});

/**
 * Register the round start transition (generic, for rounds 1-3)
 * Triggers when currentRound changes OR when game starts (LOBBY → PROMPTS)
 */
transitionRegistry.register({
  id: "round-start",
  name: "Round Start",
  trigger: (prevState, currentState) => {
    // Round 4 uses sudden death intro
    if (currentState.currentRound === 4) return false;

    // Trigger on round changes
    if (prevState !== null && prevState.currentRound !== currentState.currentRound) {
      return true;
    }

    // Also trigger when starting Round 1 (LOBBY → PROMPTS)
    if (
      prevState !== null &&
      prevState.status === "LOBBY" &&
      currentState.status === "PROMPTS" &&
      currentState.currentRound === 1
    ) {
      return true;
    }

    return false;
  },
  priority: 10,
  component: RoundStartTransition,
});

console.log("[Transitions] Initialized with", transitionRegistry.size, "transitions");
