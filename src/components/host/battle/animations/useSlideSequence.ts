import { gsap } from "../../animations/gsapConfig";
import { BattleRefs, BattleState } from "../types";

interface SlideSequenceOptions {
  refs: BattleRefs;
  answerOrder: BattleState["answerOrder"];
}

// Configuration
const SCALE = 0.65;
const MOBILE_BREAKPOINT = 768;
const HORIZONTAL_GAP = 20; // Gap between answer and fighter (pixels)
const VERTICAL_OFFSET = 0; // Position at fighter bottom (can overlap)

/**
 * createSlideTimeline - Slides answers from center to positions beside fighters
 *
 * Strategy:
 * 1. Get fighter positions from refs
 * 2. Position answers at SAME vertical level (aligned to fighters)
 * 3. Left answer goes beside left fighter, right answer beside right fighter
 * 4. Ensure answers stay within screen bounds
 */
export function createSlideTimeline({ refs, answerOrder }: SlideSequenceOptions): gsap.core.Timeline {
  const timeline = gsap.timeline();

  // Fade out VS badge
  timeline.to(refs.vsBadge.current, {
    opacity: 0,
    duration: 0.3,
  });

  const arenaRect = refs.arena.current?.getBoundingClientRect();
  const answer1Rect = refs.answer1.current?.getBoundingClientRect();
  const answer2Rect = refs.answer2.current?.getBoundingClientRect();
  const leftFighterRect = refs.leftFighter.current?.getBoundingClientRect();
  const rightFighterRect = refs.rightFighter.current?.getBoundingClientRect();

  if (arenaRect && answer1Rect && answer2Rect && leftFighterRect && rightFighterRect) {
    console.log("[createSlideTimeline] Arena:", arenaRect.width, "x", arenaRect.height);
    console.log("[createSlideTimeline] Left fighter:", leftFighterRect.bottom - arenaRect.top);
    console.log("[createSlideTimeline] Right fighter:", rightFighterRect.bottom - arenaRect.top);
    const isMobile = arenaRect.width < MOBILE_BREAKPOINT;

    // Determine which answer goes left vs right (or top vs bottom on mobile) based on battler assignment
    const leftAnswerRef = answerOrder.first === "left" ? refs.answer1 : refs.answer2;
    const rightAnswerRef = answerOrder.first === "right" ? refs.answer1 : refs.answer2;
    const leftAnswerRect = answerOrder.first === "left" ? answer1Rect : answer2Rect;
    const rightAnswerRect = answerOrder.first === "right" ? answer1Rect : answer2Rect;

    // Current center positions relative to arena
    const leftCurrentCenterX = leftAnswerRect.left + leftAnswerRect.width / 2 - arenaRect.left;
    const leftCurrentCenterY = leftAnswerRect.top + leftAnswerRect.height / 2 - arenaRect.top;
    const rightCurrentCenterX = rightAnswerRect.left + rightAnswerRect.width / 2 - arenaRect.left;
    const rightCurrentCenterY = rightAnswerRect.top + rightAnswerRect.height / 2 - arenaRect.top;

    // Scaled dimensions
    const leftScaledWidth = leftAnswerRect.width * SCALE;
    const leftScaledHeight = leftAnswerRect.height * SCALE;
    const rightScaledWidth = rightAnswerRect.width * SCALE;
    const rightScaledHeight = rightAnswerRect.height * SCALE;

    // Fighter positions relative to arena
    const leftFighterBottom = leftFighterRect.bottom - arenaRect.top;
    const rightFighterBottom = rightFighterRect.bottom - arenaRect.top;

    // Calculate SAME vertical position for BOTH answers (aligned by bottom edge)
    // Start with the lower fighter's bottom
    const fighterBaseline = Math.max(leftFighterBottom, rightFighterBottom);

    // Use the LARGER of the two scaled heights to ensure neither goes off screen
    const maxScaledHeight = Math.max(leftScaledHeight, rightScaledHeight);

    // Calculate target bottom position (same for both)
    const targetBottom = fighterBaseline + VERTICAL_OFFSET;

    // Ensure it doesn't go off screen (keep 50px from bottom for padding)
    const safeTargetBottom = Math.min(targetBottom, arenaRect.height - 50);

    // Convert bottom position to center Y for each answer (accounting for their individual heights)
    const leftTargetCenterY = safeTargetBottom - leftScaledHeight / 2;
    const rightTargetCenterY = safeTargetBottom - rightScaledHeight / 2;

    let leftTargetCenterX, rightTargetCenterX;

    if (isMobile) {
      // Mobile: Stack Vertically, centered
      leftTargetCenterX = arenaRect.width / 2;
      rightTargetCenterX = arenaRect.width / 2;
    } else {
      // Desktop: Bottom corners (very close to edges to align with avatars)
      const edgePadding = 20; // Reduced to match avatar edge positioning

      leftTargetCenterX = edgePadding + leftScaledWidth / 2;
      rightTargetCenterX = arenaRect.width - edgePadding - rightScaledWidth / 2;
    }

    // Calculate offsets from current position to target
    const leftOffsetX = leftTargetCenterX - leftCurrentCenterX;
    const leftOffsetY = leftTargetCenterY - leftCurrentCenterY;
    const rightOffsetX = rightTargetCenterX - rightCurrentCenterX;
    const rightOffsetY = rightTargetCenterY - rightCurrentCenterY;

    // Animate left answer
    timeline.to(leftAnswerRef.current, {
      x: leftOffsetX,
      y: leftOffsetY,
      scale: SCALE,
      duration: 0.5,
      ease: "power2.out",
    }, "slide");

    // Animate right answer
    timeline.to(rightAnswerRef.current, {
      x: rightOffsetX,
      y: rightOffsetY,
      scale: SCALE,
      duration: 0.5,
      ease: "power2.out",
    }, "slide");
  }

  return timeline;
}
