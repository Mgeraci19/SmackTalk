/**
 * Variant Selection Utilities
 *
 * Provides random selection for animation variants to add variety
 * without affecting game state.
 */

/**
 * Randomly select one variant from an array of animation IDs
 */
export function selectRandomVariant(variants: readonly string[]): string {
  if (variants.length === 0) {
    throw new Error("Cannot select from empty variants array");
  }
  return variants[Math.floor(Math.random() * variants.length)];
}

/**
 * Animation variant groups
 *
 * Each category maps to an array of animation IDs that can be
 * randomly selected from for variety.
 */
export const ATTACK_VARIANTS = {
  // Normal attacks (no KO)
  normal: ["attack-normal", "attack-normal-spin", "attack-normal-smash"],

  // KO attacks (non-finisher)
  ko: ["attack-ko", "attack-ko-punch"],

  // Finisher attacks (3-win streak KO)
  finisher: [
    "attack-finisher-spell",
    "attack-finisher-energy",
    "attack-finisher-punch",
  ],
} as const;

export type AttackCategory = keyof typeof ATTACK_VARIANTS;
