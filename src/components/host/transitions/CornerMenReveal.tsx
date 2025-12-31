"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { gsap } from "../animations/gsapConfig";
import { AvatarFighter } from "../AvatarFighter";
import { TransitionProps } from "./types";

/**
 * RoundRobinReveal - Shows remaining captains entering Round 3 (Round Robin)
 *
 * Displays all surviving fighters ready for the round robin phase,
 * where fighting continues until only 2 remain.
 */
export function CornerMenReveal({ gameState, onComplete }: TransitionProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const teamsContainerRef = useRef<HTMLDivElement>(null);
  const [shouldSkip, setShouldSkip] = useState(false);
  const completedRef = useRef(false);

  // Stable reference to onComplete to prevent unnecessary re-renders
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Safe completion handler that ensures we only complete once
  const safeComplete = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    // Use requestAnimationFrame to ensure we're fully out of React's render cycle
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        onCompleteRef.current();
      });
    });
  }, []);

  // Get all active fighters (not knocked out)
  const fighters = gameState.players
    ?.filter((p) => p.role === "FIGHTER" && !p.knockedOut) || [];

  // Build teams: each fighter + their corner men
  const teams = fighters.map((fighter) => {
    const cornerMen = gameState.players
      ?.filter((p) => p.role === "CORNER_MAN" && p.teamId === fighter._id) || [];

    return {
      captain: fighter,
      cornerMen,
    };
  });

  // Handle skip case in useEffect to avoid setState during render
  useEffect(() => {
    if (teams.length === 0 && !completedRef.current) {
      setShouldSkip(true);
      safeComplete();
    }
  }, [teams.length, safeComplete]);

  useEffect(() => {
    // Don't run animation if we're skipping or already completed
    if (shouldSkip || teams.length === 0 || completedRef.current) {
      return;
    }

    if (!overlayRef.current || !titleRef.current || !teamsContainerRef.current) {
      return;
    }

    const tl = gsap.timeline({
      onComplete: () => {
        safeComplete();
      },
    });

    // Initial state
    gsap.set(overlayRef.current, { opacity: 0 });
    gsap.set(titleRef.current, { y: -50, opacity: 0 });
    gsap.set(teamsContainerRef.current, { scale: 0.8, opacity: 0 });

    // Animation sequence
    tl
      // Fade in backdrop
      .to(overlayRef.current, {
        opacity: 1,
        duration: 0.3,
      })
      // Slide in title
      .to(titleRef.current, {
        y: 0,
        opacity: 1,
        duration: 0.4,
        ease: "back.out(1.7)",
      }, "+=0.2")
      // Zoom in teams
      .to(teamsContainerRef.current, {
        scale: 1,
        opacity: 1,
        duration: 0.5,
        ease: "back.out(1.7)",
      }, "+=0.3")
      // Hold for viewing
      .to({}, { duration: 4 })
      // Fade out
      .to(overlayRef.current, {
        opacity: 0,
        duration: 0.5,
      });

    return () => {
      tl.kill();
    };
  }, [shouldSkip, teams.length, safeComplete]);

  // Early return AFTER hooks, just render nothing if skipping
  if (shouldSkip || teams.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center p-8"
      >
        {/* Title */}
        <div
          ref={titleRef}
          className="text-center mb-12"
        >
          <div
            className="text-5xl md:text-7xl font-bold text-yellow-400"
            style={{ textShadow: "0 0 40px rgba(255,200,0,0.8)" }}
          >
            ROUND ROBIN
          </div>
          <div className="mt-4 text-2xl text-gray-300">
            Fighting continues until only 2 fighters remain!
          </div>
        </div>

        {/* Captains Grid - Simple display of remaining fighters */}
        <div
          ref={teamsContainerRef}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 max-w-6xl"
        >
          {teams.map((team) => (
            <div
              key={team.captain._id}
              className="flex flex-col items-center bg-gray-900/50 rounded-2xl p-6 border-2 border-yellow-500/30"
            >
              {/* Captain */}
              <AvatarFighter
                name={team.captain.name}
                avatar={team.captain.avatar}
                side="left"
                state="idle"
                size="medium"
              />
              <div className="mt-4 text-2xl font-bold text-white text-center">
                {team.captain.name}
              </div>
              <div className="mt-2 text-lg text-green-400 font-bold">
                HP: {team.captain.hp}
              </div>

              {/* Corner Men - compact display */}
              {team.cornerMen.length > 0 && (
                <div className="mt-3 text-sm text-purple-300">
                  Supported by {team.cornerMen.map(cm => cm.name).join(", ")}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
