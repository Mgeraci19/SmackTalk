import { gsap } from "../../animations/gsapConfig";
import type { AnimationDefinition, BattleSide } from "../core/types";
import { animationRegistry } from "../core/AnimationRegistry";
import { TIMINGS } from "../config";

/**
 * Helper to determine winner and get common attack data
 */
function getAttackData(context: Parameters<AnimationDefinition["create"]>[0]) {
  const leftBattler = context.getLeftBattler?.() ?? context.leftBattler;
  const rightBattler = context.getRightBattler?.() ?? context.rightBattler;
  const leftDamage = context.getLeftDamage?.() ?? context.leftDamage;
  const rightDamage = context.getRightDamage?.() ?? context.rightDamage;

  let winnerIsLeft: boolean;
  if (leftBattler?.isWinner) {
    winnerIsLeft = true;
  } else if (rightBattler?.isWinner) {
    winnerIsLeft = false;
  } else {
    const leftVotes = leftBattler?.voteCount || 0;
    const rightVotes = rightBattler?.voteCount || 0;
    winnerIsLeft = leftVotes > rightVotes;
  }

  const damage = winnerIsLeft ? rightDamage : leftDamage;
  const direction = winnerIsLeft ? 1 : -1;
  const winnerRef = winnerIsLeft
    ? context.refs.leftFighter
    : context.refs.rightFighter;
  const loserRef = winnerIsLeft
    ? context.refs.rightFighter
    : context.refs.leftFighter;
  const loserSide: BattleSide = winnerIsLeft ? "right" : "left";
  const winnerSide: BattleSide = winnerIsLeft ? "left" : "right";

  return {
    winnerIsLeft,
    damage,
    direction,
    winnerRef,
    loserRef,
    loserSide,
    winnerSide,
    leftBattler,
    rightBattler,
  };
}

/**
 * attack-normal-spin - Winner spins toward loser and bounces off
 *
 * Flow:
 * 1. Winner rotates 360° while moving toward loser (0.25s)
 * 2. Winner bounces back with slight overshoot (0.25s)
 * 3. Loser shows hurt flash
 *
 * Total duration: 0.5s
 */
export const attackNormalSpinAnimation: AnimationDefinition = {
  id: "attack-normal-spin",
  name: "Spin Attack",
  category: "battle",
  duration: 0.5,
  canRunInParallel: true,
  priority: 1,
  tags: ["attack", "damage", "variant"],

  create: (context) => {
    const { direction, winnerRef, loserSide, winnerSide, damage } =
      getAttackData(context);

    const timeline = gsap.timeline({
      onComplete: () => {
        context.setPhase?.("complete");
        context.onComplete?.();
      },
    });

    context.setFighterState?.(winnerSide, "attacking");

    // Spin toward loser
    timeline.to(winnerRef.current, {
      x: direction * 100,
      rotation: direction * 360,
      duration: 0.25,
      ease: "power2.in",
    });

    // Bounce back with overshoot
    timeline.to(winnerRef.current, {
      x: direction * -20,
      rotation: 0,
      duration: 0.15,
      ease: "back.out(2)",
    });

    // Return to center
    timeline.to(winnerRef.current, {
      x: 0,
      duration: 0.1,
      ease: "power2.out",
    });

    // Hurt flash + damage
    timeline.call(
      () => {
        console.log(
          `[attackNormalSpinAnimation] Applying ${damage} damage to ${loserSide}`
        );
        context.setFighterState?.(loserSide, "hurt");
        context.onDamageApplied?.(loserSide, damage);

        setTimeout(() => {
          context.setFighterState?.(loserSide, "idle");
          context.setFighterState?.(winnerSide, "idle");
        }, 200);
      },
      [],
      "-=0.2"
    );

    return timeline;
  },
};

/**
 * attack-normal-smash - Winner jumps up and smashes down
 *
 * Flow:
 * 1. Winner jumps up (0.2s)
 * 2. Winner slams down toward loser (0.15s)
 * 3. Winner returns (0.25s)
 * 4. Loser shows hurt flash with shake effect
 *
 * Total duration: 0.6s
 */
export const attackNormalSmashAnimation: AnimationDefinition = {
  id: "attack-normal-smash",
  name: "Smash Attack",
  category: "battle",
  duration: 0.6,
  canRunInParallel: true,
  priority: 1,
  tags: ["attack", "damage", "variant"],

  create: (context) => {
    const { direction, winnerRef, loserRef, loserSide, winnerSide, damage } =
      getAttackData(context);

    const timeline = gsap.timeline({
      onComplete: () => {
        context.setPhase?.("complete");
        context.onComplete?.();
      },
    });

    context.setFighterState?.(winnerSide, "attacking");

    // Jump up
    timeline.to(winnerRef.current, {
      y: -80,
      x: direction * 50,
      scale: 1.1,
      duration: 0.2,
      ease: "power2.out",
    });

    // Slam down toward loser
    timeline.to(winnerRef.current, {
      y: 0,
      x: direction * 100,
      scale: 1.0,
      duration: 0.15,
      ease: "power3.in",
    });

    // Loser shakes on impact
    timeline.call(
      () => {
        console.log(
          `[attackNormalSmashAnimation] Applying ${damage} damage to ${loserSide}`
        );
        context.setFighterState?.(loserSide, "hurt");
        context.onDamageApplied?.(loserSide, damage);

        // Shake effect on loser
        gsap.to(loserRef.current, {
          x: direction * 10,
          duration: 0.05,
          yoyo: true,
          repeat: 3,
          ease: "none",
        });

        setTimeout(() => {
          context.setFighterState?.(loserSide, "idle");
        }, 200);
      },
      [],
      "+=0.05"
    );

    // Return to position
    timeline.to(winnerRef.current, {
      x: 0,
      duration: 0.2,
      ease: "power2.out",
    });

    timeline.call(() => {
      context.setFighterState?.(winnerSide, "idle");
    });

    return timeline;
  },
};

/**
 * attack-ko-punch - Winner punches, loser falls sideways
 *
 * Flow:
 * 1. Winner winds up (pulls back) (0.15s)
 * 2. Winner lunges with punch (0.2s)
 * 3. Impact flash on loser
 * 4. Loser tips and falls sideways (0.6s)
 * 5. K.O. overlay appears
 * 6. Hold (1.0s)
 *
 * Total duration: 2.5s
 */
export const attackKOPunchAnimation: AnimationDefinition = {
  id: "attack-ko-punch",
  name: "KO Punch",
  category: "battle",
  duration: 2.5,
  canRunInParallel: false,
  priority: 10,
  tags: ["attack", "ko", "variant"],

  create: (context) => {
    const {
      direction,
      winnerRef,
      loserRef,
      loserSide,
      winnerSide,
      damage,
      winnerIsLeft,
    } = getAttackData(context);
    const leftBattler = context.getLeftBattler?.() ?? context.leftBattler;
    const rightBattler = context.getRightBattler?.() ?? context.rightBattler;
    const loser = winnerIsLeft ? rightBattler : leftBattler;

    const timeline = gsap.timeline({
      onComplete: () => {
        context.setTieMessage?.(null);
        context.setFighterState?.(loserSide, "ko");
        context.setPhase?.("complete");
        context.onComplete?.();
      },
    });

    context.setFighterState?.(winnerSide, "attacking");

    // Wind up (pull back)
    timeline.to(winnerRef.current, {
      x: direction * -30,
      duration: 0.15,
      ease: "power2.out",
    });

    // Lunge with punch
    timeline.to(winnerRef.current, {
      x: direction * 150,
      duration: 0.2,
      ease: "power3.in",
    });

    // Hurt flash + damage
    timeline.call(
      () => {
        console.log(
          `[attackKOPunchAnimation] Applying ${damage} KO damage to ${loserSide}`
        );
        context.setFighterState?.(loserSide, "hurt");
        context.onDamageApplied?.(loserSide, damage);
      },
      [],
      `+=${TIMINGS.damageDelay}`
    );

    // Loser tips and falls sideways
    timeline.to(
      loserRef.current,
      {
        rotation: direction * 90,
        y: 100,
        x: direction * 50,
        opacity: 0.7,
        duration: 0.6,
        ease: "power2.in",
      },
      "+=0.1"
    );

    // Show K.O. message
    timeline.call(
      () => {
        console.log(`[attackKOPunchAnimation] Showing K.O. for ${loser?.name}`);
        context.setTieMessage?.("K.O.");
      },
      [],
      "+=0.1"
    );

    // Return winner to position
    timeline.to(
      winnerRef.current,
      {
        x: 0,
        duration: 0.3,
        ease: "power2.out",
      },
      "-=0.3"
    );

    // Hold for dramatic effect
    timeline.to({}, { duration: 1.0 });

    return timeline;
  },
};

// Auto-register all attack variants
animationRegistry.register(attackNormalSpinAnimation);
animationRegistry.register(attackNormalSmashAnimation);
animationRegistry.register(attackKOPunchAnimation);
