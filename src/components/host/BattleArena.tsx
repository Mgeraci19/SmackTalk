"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import { AvatarFighter, FighterState } from "./AvatarFighter";
import { useBattleSequence } from "./animations/sequences";
import { BattleSide } from "./animations/registry/types";
import { gsap } from "./animations/gsapConfig";

interface BattlerInfo {
  id: string;
  name: string;
  avatar?: string;
  answer: string;
  voteCount: number;
  isWinner: boolean;
  voters: string[];
  hp: number;
  maxHp: number;
}

interface BattleArenaProps {
  leftBattler: BattlerInfo | null;
  rightBattler: BattlerInfo | null;
  isReveal: boolean;
  promptId?: string;
  promptText?: string;
  onBattleComplete?: () => void;
  onDamageApplied?: (side: BattleSide, damage: number) => void;
}

type RevealPhase =
  | "waiting"       // Waiting for data
  | "question"      // Question animating in
  | "avatars_push"  // Avatars pushing to sides
  | "slam1"         // First answer slamming in
  | "slam2"         // Second answer slamming in
  | "voting"        // Players voting
  | "sliding"       // Answers sliding to sides
  | "revealing"     // Vote counts ticking up
  | "attacking"     // Attack animation
  | "complete";     // Done

/**
 * BattleArena - Phased battle display
 *
 * Flow:
 * 1. Question animates in prominently
 * 2. Avatars push from center to sides
 * 3. Answers slam into center (anonymous, randomized order)
 * 4. Players vote
 * 5. Answers slide to sides under avatars (constrained)
 * 6. Vote counts tick up, winner highlighted
 * 7. Quick attack animation
 */
export function BattleArena({
  leftBattler,
  rightBattler,
  isReveal,
  promptId,
  promptText,
  onBattleComplete,
  onDamageApplied,
}: BattleArenaProps) {
  // Refs for animation targets
  const leftFighterRef = useRef<HTMLDivElement>(null);
  const rightFighterRef = useRef<HTMLDivElement>(null);
  const arenaRef = useRef<HTMLDivElement>(null);
  const questionRef = useRef<HTMLDivElement>(null);
  const answer1Ref = useRef<HTMLDivElement>(null);
  const answer2Ref = useRef<HTMLDivElement>(null);

  // Phase tracking
  const [phase, setPhase] = useState<RevealPhase>("waiting");
  const [displayedVotes, setDisplayedVotes] = useState({ left: 0, right: 0 });

  // Fighter states
  const [leftState, setLeftState] = useState<FighterState>("idle");
  const [rightState, setRightState] = useState<FighterState>("idle");

  // Track if we've started the sequence for this prompt
  const hasStartedRef = useRef(false);
  const hasRevealedRef = useRef(false);

  // Randomize answer order (but remember mapping)
  const answerOrder = useMemo(() => {
    if (!leftBattler || !rightBattler) return { first: "left", second: "right" };
    return Math.random() > 0.5
      ? { first: "left" as const, second: "right" as const }
      : { first: "right" as const, second: "left" as const };
  }, [promptId]); // Re-randomize on prompt change

  // Store callbacks in refs
  const onBattleCompleteRef = useRef(onBattleComplete);
  const onDamageAppliedRef = useRef(onDamageApplied);
  onBattleCompleteRef.current = onBattleComplete;
  onDamageAppliedRef.current = onDamageApplied;

  // Battle sequence hook for attack animation
  const { actions: battleActions } = useBattleSequence({
    leftFighter: leftFighterRef,
    rightFighter: rightFighterRef,
    arenaContainer: arenaRef,
    config: {
      speedMultiplier: 0.8,
      shakeIntensity: 1.2,
    },
    onDamageApplied: (side, damage) => {
      if (side === "left") {
        setLeftState("hurt");
        setTimeout(() => setLeftState("idle"), 200);
      } else {
        setRightState("hurt");
        setTimeout(() => setRightState("idle"), 200);
      }
      onDamageAppliedRef.current?.(side, damage);
    },
    onSequenceComplete: () => {
      setPhase("complete");
      onBattleCompleteRef.current?.();
    },
  });

  const battleActionsRef = useRef(battleActions);
  battleActionsRef.current = battleActions;

  // Get answer data based on order
  const firstAnswer = answerOrder.first === "left" ? leftBattler : rightBattler;
  const secondAnswer = answerOrder.second === "left" ? leftBattler : rightBattler;

  // Reset on prompt change
  useEffect(() => {
    hasStartedRef.current = false;
    hasRevealedRef.current = false;
    setPhase("waiting");
    setDisplayedVotes({ left: 0, right: 0 });
    setLeftState("idle");
    setRightState("idle");
    battleActionsRef.current.stop();

    // Reset positions
    if (leftFighterRef.current) gsap.set(leftFighterRef.current, { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 });
    if (rightFighterRef.current) gsap.set(rightFighterRef.current, { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 });
    if (questionRef.current) gsap.set(questionRef.current, { opacity: 0, scale: 0.8, y: 20 });
    if (answer1Ref.current) gsap.set(answer1Ref.current, { opacity: 0, scale: 0.5 });
    if (answer2Ref.current) gsap.set(answer2Ref.current, { opacity: 0, scale: 0.5 });
  }, [promptId]);

  // Start the full sequence when we have battlers
  useEffect(() => {
    if (!leftBattler || !rightBattler || !promptText || hasStartedRef.current) return;
    hasStartedRef.current = true;

    const timeline = gsap.timeline();

    // Phase 1: Question animates in
    setPhase("question");
    timeline.to(questionRef.current, {
      opacity: 1,
      scale: 1,
      y: 0,
      duration: 0.5,
      ease: "back.out(1.5)",
    });

    // Hold for reading the question
    timeline.to({}, { duration: 3 });

    // Phase 2: Avatars are already on sides (static layout now)
    timeline.call(() => setPhase("avatars_push"));
    timeline.to({}, { duration: 0.3 });

    // Phase 3: Slam in first answer
    timeline.call(() => setPhase("slam1"));
    timeline.to(answer1Ref.current, {
      opacity: 1,
      scale: 1,
      duration: 0.3,
      ease: "back.out(2)",
    });

    // Pause for reading
    timeline.to({}, { duration: 2.5 });

    // Phase 4: Slam in second answer
    timeline.call(() => setPhase("slam2"));
    timeline.to(answer2Ref.current, {
      opacity: 1,
      scale: 1,
      duration: 0.3,
      ease: "back.out(2)",
    });

    // Move to voting phase
    timeline.call(() => setPhase("voting"), [], "+=0.5");
  }, [leftBattler, rightBattler, promptText]);

  // Handle reveal sequence
  useEffect(() => {
    if (!isReveal || hasRevealedRef.current || !leftBattler || !rightBattler) return;
    if (phase !== "voting") return;

    hasRevealedRef.current = true;

    const timeline = gsap.timeline();

    // Phase: Sliding - reveal authors first
    setPhase("sliding");

    // Pause for "who wrote that?!" reaction
    timeline.to({}, { duration: 1.2 });

    // Slide answers to the sides
    const leftAnswerRef = answerOrder.first === "left" ? answer1Ref : answer2Ref;
    const rightAnswerRef = answerOrder.first === "right" ? answer1Ref : answer2Ref;

    timeline.to(leftAnswerRef.current, {
      x: "-120%",
      scale: 0.7,
      opacity: 0.8,
      duration: 0.6,
      ease: "power2.inOut",
    }, "slide");

    timeline.to(rightAnswerRef.current, {
      x: "120%",
      scale: 0.7,
      opacity: 0.8,
      duration: 0.6,
      ease: "power2.inOut",
    }, "slide");

    // Phase: Revealing votes
    timeline.call(() => setPhase("revealing"));

    // Tick up vote counts
    const leftVotes = leftBattler.voteCount;
    const rightVotes = rightBattler.voteCount;
    const maxVotes = Math.max(leftVotes, rightVotes, 1);
    const tickDuration = 0.5 / maxVotes;

    for (let i = 1; i <= maxVotes; i++) {
      timeline.call(() => {
        setDisplayedVotes({
          left: Math.min(i, leftVotes),
          right: Math.min(i, rightVotes),
        });
      }, [], `+=${tickDuration}`);
    }

    // Pause after votes shown
    timeline.to({}, { duration: 0.8 });

    // Push fighters toward center
    timeline.to(leftFighterRef.current, {
      x: 100,
      duration: 0.4,
      ease: "power2.out",
    }, "push");

    timeline.to(rightFighterRef.current, {
      x: -100,
      duration: 0.4,
      ease: "power2.out",
    }, "push");

    // Phase: Attacking
    timeline.call(() => {
      setPhase("attacking");

      const winner = leftBattler.isWinner ? leftBattler : rightBattler.isWinner ? rightBattler : null;
      const loser = leftBattler.isWinner ? rightBattler : rightBattler.isWinner ? leftBattler : null;

      if (winner && loser) {
        const totalVotes = leftBattler.voteCount + rightBattler.voteCount;
        const DAMAGE_CAP = 35;
        const loserVotes = winner === leftBattler ? rightBattler.voteCount : leftBattler.voteCount;
        const damage = totalVotes > 0 ? Math.floor((loserVotes / totalVotes) * DAMAGE_CAP) : 0;

        // Check if this will KO the loser
        const loserNewHp = (loser.hp || 100) - damage;
        const isKO = loserNewHp <= 0;

        if (leftBattler.isWinner) {
          setLeftState("attacking");
        } else {
          setRightState("attacking");
        }

        // If KO, do the bump-off animation after attack
        if (isKO) {
          const loserRef = leftBattler.isWinner ? rightFighterRef : leftFighterRef;
          const direction = leftBattler.isWinner ? 1 : -1;

          // Attack first, then bump off
          const attackTimeline = gsap.timeline({
            onComplete: () => {
              // Bump loser offscreen
              gsap.to(loserRef.current, {
                x: direction * 800,
                rotation: direction * 720,
                opacity: 0,
                duration: 0.8,
                ease: "power2.in",
                onComplete: () => {
                  if (leftBattler.isWinner) {
                    setRightState("ko");
                  } else {
                    setLeftState("ko");
                  }
                  setPhase("complete");
                  onBattleCompleteRef.current?.();
                }
              });
            }
          });

          // Quick attack animation
          const winnerRef = leftBattler.isWinner ? leftFighterRef : rightFighterRef;
          attackTimeline.to(winnerRef.current, {
            x: direction * 150,
            duration: 0.15,
            ease: "power2.in",
          });
          attackTimeline.to(winnerRef.current, {
            x: direction * 100,
            duration: 0.1,
            ease: "power2.out",
          });

          // Hurt flash on loser
          attackTimeline.call(() => {
            if (leftBattler.isWinner) {
              setRightState("hurt");
            } else {
              setLeftState("hurt");
            }
            onDamageAppliedRef.current?.(leftBattler.isWinner ? "right" : "left", damage);
          }, [], "-=0.1");

        } else {
          // Normal attack (not KO)
          battleActionsRef.current.playBattle({
            winnerId: winner.id,
            winnerSide: leftBattler.isWinner ? "left" : "right",
            loserId: leftBattler.isWinner ? rightBattler.id : leftBattler.id,
            loserSide: leftBattler.isWinner ? "right" : "left",
            damage,
            isKO: false,
            voteCount: winner.voteCount,
          });
        }
      } else {
        // Tie - just complete
        setPhase("complete");
        onBattleCompleteRef.current?.();
      }
    });
  }, [isReveal, phase, leftBattler, rightBattler, answerOrder]);

  // Update final states when complete
  useEffect(() => {
    if (phase === "complete" && leftBattler && rightBattler) {
      if (leftBattler.isWinner) {
        setLeftState("victory");
        setRightState("ko");
      } else if (rightBattler.isWinner) {
        setRightState("victory");
        setLeftState("ko");
      }
    }
  }, [phase, leftBattler, rightBattler]);

  if (!leftBattler || !rightBattler) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Waiting for battlers...
      </div>
    );
  }

  const showVotes = phase === "revealing" || phase === "attacking" || phase === "complete";
  const showWinner = phase === "attacking" || phase === "complete";
  const showAuthors = phase === "sliding" || phase === "revealing" || phase === "attacking" || phase === "complete";

  return (
    <div
      ref={arenaRef}
      className="relative w-full h-full flex flex-col overflow-hidden"
      data-phase={phase}
    >
      {/* Question - Large and prominent at top */}
      <div
        ref={questionRef}
        className="text-center px-8 py-6 mb-4"
        style={{ opacity: 0, transform: "scale(0.8) translateY(20px)" }}
      >
        <div className="text-4xl md:text-5xl font-bold text-white leading-tight max-w-4xl mx-auto">
          &ldquo;{promptText}&rdquo;
        </div>
      </div>

      {/* Main battle area */}
      <div className="flex-1 flex items-center justify-between px-4 min-h-0">
        {/* Left Avatar */}
        <div className="flex-shrink-0 w-40 flex flex-col items-center">
          <AvatarFighter
            ref={leftFighterRef}
            name={leftBattler.name}
            avatar={leftBattler.avatar}
            side="left"
            state={leftState}
            isWinner={showWinner && leftBattler.isWinner}
            size="large"
          />
        </div>

        {/* Center - Answers and VS */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 min-w-0 max-w-3xl mx-auto">
          {/* Stacked Answers with VS in between */}
          <div className="w-full flex flex-col items-center">
            {/* First Answer */}
            <div
              ref={answer1Ref}
              className={`
                w-full max-w-2xl
                rounded-xl p-6
                transition-colors duration-300
                ${showWinner && firstAnswer?.isWinner
                  ? "bg-green-900/50 ring-2 ring-yellow-400"
                  : showWinner && !firstAnswer?.isWinner
                  ? "bg-gray-800/50 opacity-70"
                  : "bg-gray-800"
                }
              `}
              style={{ opacity: 0, transform: "scale(0.5)" }}
            >
              {/* Author name - shown after slide phase */}
              {showAuthors && (
                <div className="text-sm text-gray-400 text-center mb-2">
                  {firstAnswer?.name}
                </div>
              )}
              <div className="text-3xl md:text-4xl text-white text-center font-medium leading-relaxed">
                {firstAnswer?.answer}
              </div>
              {/* Vote count */}
              {showVotes && (
                <div className={`text-center mt-3 text-xl font-bold ${
                  showWinner && firstAnswer?.isWinner ? "text-yellow-400" : "text-gray-400"
                }`}>
                  {answerOrder.first === "left" ? displayedVotes.left : displayedVotes.right} vote{(answerOrder.first === "left" ? displayedVotes.left : displayedVotes.right) === 1 ? "" : "s"}
                </div>
              )}
            </div>

            {/* VS Badge - Between answers */}
            <div
              className="text-5xl font-bold text-red-500 my-3"
              style={{
                textShadow: "0 0 20px rgba(255,0,0,0.5)",
                fontFamily: "'Impact', 'Arial Black', sans-serif",
                opacity: phase === "question" || phase === "avatars_push" || phase === "slam1" || phase === "slam2" || phase === "voting" ? 1 : 0,
                transition: "opacity 0.3s",
              }}
            >
              VS
            </div>

            {/* Second Answer */}
            <div
              ref={answer2Ref}
              className={`
                w-full max-w-2xl
                rounded-xl p-6
                transition-colors duration-300
                ${showWinner && secondAnswer?.isWinner
                  ? "bg-green-900/50 ring-2 ring-yellow-400"
                  : showWinner && !secondAnswer?.isWinner
                  ? "bg-gray-800/50 opacity-70"
                  : "bg-gray-800"
                }
              `}
              style={{ opacity: 0, transform: "scale(0.5)" }}
            >
              {/* Author name - shown after slide phase */}
              {showAuthors && (
                <div className="text-sm text-gray-400 text-center mb-2">
                  {secondAnswer?.name}
                </div>
              )}
              <div className="text-3xl md:text-4xl text-white text-center font-medium leading-relaxed">
                {secondAnswer?.answer}
              </div>
              {/* Vote count */}
              {showVotes && (
                <div className={`text-center mt-3 text-xl font-bold ${
                  showWinner && secondAnswer?.isWinner ? "text-yellow-400" : "text-gray-400"
                }`}>
                  {answerOrder.second === "left" ? displayedVotes.left : displayedVotes.right} vote{(answerOrder.second === "left" ? displayedVotes.left : displayedVotes.right) === 1 ? "" : "s"}
                </div>
              )}
            </div>
          </div>

          {/* Status Text - Only one place now */}
          {phase === "voting" && (
            <div className="mt-6 text-xl text-gray-400 animate-pulse">
              Players are voting...
            </div>
          )}
        </div>

        {/* Right Avatar */}
        <div className="flex-shrink-0 w-40 flex flex-col items-center">
          <AvatarFighter
            ref={rightFighterRef}
            name={rightBattler.name}
            avatar={rightBattler.avatar}
            side="right"
            state={rightState}
            isWinner={showWinner && rightBattler.isWinner}
            size="large"
          />
        </div>
      </div>
    </div>
  );
}
