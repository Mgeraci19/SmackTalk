/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef } from "react";
import { gsap } from "./animations/gsapConfig";

interface CornerManAssignmentProps {
  cornerManName: string;
  cornerManAvatar?: string;
  champName: string;
  champAvatar?: string;
  onComplete?: () => void;
}

/**
 * CornerManAssignment - Shows when a player gets KO'd and becomes a corner man
 *
 * Displays both avatars with champ large and corner man smaller,
 * with text announcing the assignment.
 */
export function CornerManAssignment({
  cornerManName,
  cornerManAvatar,
  champName,
  champAvatar,
  onComplete,
}: CornerManAssignmentProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const timeline = gsap.timeline({
      onComplete: () => {
        // Wait a moment before calling onComplete
        setTimeout(() => onComplete?.(), 500);
      },
    });

    // Animate in
    timeline.fromTo(
      containerRef.current,
      {
        opacity: 0,
        scale: 0.8,
      },
      {
        opacity: 1,
        scale: 1,
        duration: 0.5,
        ease: "back.out(1.7)",
      }
    );

    // Hold for reading
    timeline.to({}, { duration: 3 });

    // Animate out
    timeline.to(containerRef.current, {
      opacity: 0,
      scale: 0.8,
      duration: 0.4,
      ease: "power2.in",
    });

    return () => {
      timeline.kill();
    };
  }, [onComplete]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      style={{ opacity: 0 }}
    >
      <div className="bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900 rounded-2xl p-8 md:p-12 shadow-2xl max-w-2xl mx-4">
        {/* Title */}
        <div className="text-center mb-6">
          <div className="text-2xl md:text-3xl font-bold text-yellow-400 mb-2">
            CORNER MAN ASSIGNED!
          </div>
          <div className="text-lg md:text-xl text-gray-300">
            A new alliance has been formed
          </div>
        </div>

        {/* Avatars */}
        <div className="flex items-center justify-center gap-8 mb-6">
          {/* Corner Man - Smaller */}
          <div className="flex flex-col items-center">
            {cornerManAvatar ? (
              <img
                src={cornerManAvatar}
                alt={cornerManName}
                className="w-32 h-32 md:w-40 md:h-40 rounded-xl border-4 border-red-500 shadow-lg object-cover"
              />
            ) : (
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-xl border-4 border-red-500 bg-gray-700 flex items-center justify-center text-6xl text-gray-500">
                ?
              </div>
            )}
            <div className="text-base md:text-lg font-bold text-red-400 mt-2">
              {cornerManName}
            </div>
            <div className="text-sm text-gray-400">Corner Man</div>
          </div>

          {/* Arrow */}
          <div className="text-4xl md:text-5xl text-yellow-400">→</div>

          {/* Champ - Larger */}
          <div className="flex flex-col items-center">
            {champAvatar ? (
              <img
                src={champAvatar}
                alt={champName}
                className="w-48 h-48 md:w-56 md:h-56 rounded-xl border-4 border-yellow-400 shadow-2xl object-cover"
              />
            ) : (
              <div className="w-48 h-48 md:w-56 md:h-56 rounded-xl border-4 border-yellow-400 bg-gray-700 flex items-center justify-center text-8xl text-gray-500">
                ?
              </div>
            )}
            <div className="text-xl md:text-2xl font-bold text-yellow-400 mt-2">
              {champName}
            </div>
            <div className="text-sm text-gray-400">Champion</div>
          </div>
        </div>

        {/* Message */}
        <div className="text-center text-xl md:text-2xl font-bold text-white">
          <span className="text-red-400">{cornerManName}</span> is now supporting{" "}
          <span className="text-yellow-400">{champName}</span>!
        </div>
      </div>
    </div>
  );
}
