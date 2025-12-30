import { gsap } from "../gsapConfig";
import {
  AnimationDefinition,
  AnimationContext,
  AnimationOptions,
} from "../registry/types";

/**
 * Resolves an animation target to a DOM element
 */
function resolveTarget(target: AnimationContext["attacker"] | undefined): HTMLElement | null {
  if (!target) return null;
  if (target instanceof HTMLElement) return target;
  if (typeof target === "string") return document.querySelector(target);
  if ("current" in target) return target.current;
  return null;
}

/**
 * Creates a damage number element
 * @param isLoser - true for the loser (bigger, bolder), false for winner (smaller, muted)
 */
function createDamageNumber(
  container: HTMLElement,
  damage: number,
  x: number,
  y: number,
  isCritical: boolean = false,
  isLoser: boolean = true
): HTMLDivElement {
  const el = document.createElement("div");
  el.textContent = `-${damage}`;
  el.className = "damage-number";

  // Loser: big, bold, bright red
  // Winner: smaller, muted gray (they took less damage)
  const fontSize = isLoser
    ? (isCritical ? "4rem" : "3rem")
    : "1.5rem";
  const color = isLoser
    ? (isCritical ? "#ff0000" : "#ff4444")
    : "#888888";
  const opacity = isLoser ? "1" : "0.7";

  el.style.cssText = `
    position: absolute;
    left: ${x}px;
    top: ${y}px;
    transform: translate(-50%, -50%) scale(0);
    font-family: 'Impact', 'Arial Black', sans-serif;
    font-size: ${fontSize};
    font-weight: ${isLoser ? "bold" : "normal"};
    color: ${color};
    opacity: ${opacity};
    text-shadow:
      -2px -2px 0 #000,
      2px -2px 0 #000,
      -2px 2px 0 #000,
      2px 2px 0 #000;
    z-index: 1000;
    pointer-events: none;
    user-select: none;
  `;
  container.appendChild(el);
  return el;
}

/**
 * Floating damage number effect
 */
export const damageNumberAnimation: AnimationDefinition = {
  id: "damage-number",
  name: "Damage Number",
  category: "effect",
  duration: 0.8,

  create: (context: AnimationContext, options?: AnimationOptions) => {
    const { defender, arenaContainer } = context;
    const damage = options?.damage || 10;
    const isCritical = damage >= 20;
    const isLoser = true; // Default to loser styling (main target)

    const defenderEl = resolveTarget(defender);
    const arenaEl = resolveTarget(arenaContainer);

    const timeline = gsap.timeline({
      onComplete: context.onComplete,
    });

    // Use arena container for positioning
    const container = arenaEl || defenderEl?.parentElement;
    if (!defenderEl || !container) {
      return timeline;
    }

    // Get position above defender relative to arena container
    const rect = defenderEl.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const x = rect.left - containerRect.left + rect.width / 2;
    const y = rect.top - containerRect.top;

    // Create damage number (loser styling - big and bold)
    const damageEl = createDamageNumber(
      container,
      damage,
      x,
      y,
      isCritical,
      isLoser
    );

    // Pop in
    timeline.to(damageEl, {
      scale: isCritical ? 1.3 : 1,
      duration: 0.1,
      ease: "back.out(3)",
    });

    // Float upward and fade
    timeline.to(damageEl, {
      y: "-=60",
      opacity: 0,
      scale: 0.7,
      duration: 0.6,
      ease: "power2.out",
      onComplete: () => {
        damageEl.remove();
      },
    });

    return timeline;
  },
};

/**
 * Multi-hit damage numbers - cascading numbers for multi-hit attacks
 */
export const multiHitDamageAnimation: AnimationDefinition = {
  id: "multi-hit-damage",
  name: "Multi-Hit Damage",
  category: "effect",
  duration: 1.2,

  create: (context: AnimationContext, options?: AnimationOptions) => {
    const { defender, arenaContainer } = context;
    const hitCount = options?.hitCount || 3;
    const damagePerHit = options?.damage || 5;

    const defenderEl = resolveTarget(defender);
    const arenaEl = resolveTarget(arenaContainer);

    const timeline = gsap.timeline({
      onComplete: context.onComplete,
    });

    // Use arena container for positioning
    const container = arenaEl || defenderEl?.parentElement;
    if (!defenderEl || !container) {
      return timeline;
    }

    const rect = defenderEl.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const baseX = rect.left - containerRect.left + rect.width / 2;
    const baseY = rect.top - containerRect.top;

    // Create multiple damage numbers with slight delays
    for (let i = 0; i < hitCount; i++) {
      const offsetX = -30 + Math.random() * 60;
      const offsetY = -10 + Math.random() * 20;
      const x = baseX + offsetX;
      const y = baseY + offsetY;

      const damageEl = createDamageNumber(
        container,
        damagePerHit,
        x,
        y,
        false,
        true // isLoser
      );

      // Staggered pop and float
      const delay = i * 0.12;

      timeline.to(
        damageEl,
        {
          scale: 0.9,
          duration: 0.08,
          ease: "back.out(2)",
        },
        delay
      );

      timeline.to(
        damageEl,
        {
          y: "-=50",
          x: `+=${offsetX > 0 ? 20 : -20}`,
          opacity: 0,
          scale: 0.6,
          duration: 0.5,
          ease: "power2.out",
          onComplete: () => {
            damageEl.remove();
          },
        },
        delay + 0.08
      );
    }

    // Add final total at the end
    const totalDamage = damagePerHit * hitCount;
    const totalEl = createDamageNumber(
      container,
      totalDamage,
      baseX,
      baseY - 40,
      true, // isCritical
      true  // isLoser
    );

    timeline.to(
      totalEl,
      {
        scale: 1.2,
        duration: 0.15,
        ease: "back.out(3)",
      },
      hitCount * 0.12
    );

    timeline.to(
      totalEl,
      {
        y: "-=80",
        opacity: 0,
        scale: 0.8,
        duration: 0.7,
        ease: "power2.out",
        onComplete: () => {
          totalEl.remove();
        },
      },
      hitCount * 0.12 + 0.15
    );

    return timeline;
  },
};

/**
 * HP bar drain effect - red flash and shake on HP bar
 */
export const hpDrainAnimation: AnimationDefinition = {
  id: "hp-drain",
  name: "HP Drain",
  category: "effect",
  duration: 0.4,

  create: (context: AnimationContext) => {
    const { defender } = context;
    const defenderEl = resolveTarget(defender);

    const timeline = gsap.timeline({
      onComplete: context.onComplete,
    });

    if (!defenderEl) {
      return timeline;
    }

    // Quick red tint flash
    timeline.to(defenderEl, {
      filter: "brightness(1.5) saturate(0.5) hue-rotate(-30deg)",
      duration: 0.05,
    });

    timeline.to(defenderEl, {
      filter: "none",
      duration: 0.35,
      ease: "power2.out",
    });

    return timeline;
  },
};
