import { gsap } from "../../animations/gsapConfig";

/**
 * Visual Effect Helpers
 *
 * Reusable GSAP-based visual effects for attack animations.
 * These create and clean up temporary DOM elements for effects.
 */

/**
 * Create a screen shake effect
 */
export function createScreenShake(
  container: HTMLElement | null,
  options: {
    intensity?: number;
    duration?: number;
  } = {}
): gsap.core.Tween | null {
  if (!container) return null;

  const { intensity = 10, duration = 0.3 } = options;

  return gsap.to(container, {
    x: `random(-${intensity}, ${intensity})`,
    y: `random(-${intensity / 2}, ${intensity / 2})`,
    duration: 0.05,
    repeat: Math.floor(duration / 0.05),
    yoyo: true,
    ease: "none",
    onComplete: () => {
      gsap.set(container, { x: 0, y: 0 });
    },
  });
}

/**
 * Create a flash overlay effect
 */
export function createFlashOverlay(
  container: HTMLElement | null,
  options: {
    color?: string;
    duration?: number;
  } = {}
): HTMLDivElement | null {
  if (!container) return null;

  const { color = "white", duration = 0.2 } = options;

  const flash = document.createElement("div");
  flash.style.cssText = `
    position: absolute;
    inset: 0;
    background: ${color};
    pointer-events: none;
    z-index: 100;
    opacity: 0;
  `;
  container.appendChild(flash);

  gsap.to(flash, {
    opacity: 0.8,
    duration: duration * 0.3,
    yoyo: true,
    repeat: 1,
    ease: "power2.inOut",
    onComplete: () => {
      flash.remove();
    },
  });

  return flash;
}

/**
 * Create particle dissolve effect on element
 * Creates multiple particles that scatter and fade
 */
export function createParticleDissolve(
  element: HTMLElement | null,
  container: HTMLElement | null,
  options: {
    particleCount?: number;
    duration?: number;
    color?: string;
  } = {}
): gsap.core.Timeline | null {
  if (!element || !container) return null;

  const { particleCount = 20, duration = 1.2, color = "#FFD700" } = options;

  const rect = element.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  const centerX = rect.left - containerRect.left + rect.width / 2;
  const centerY = rect.top - containerRect.top + rect.height / 2;

  const timeline = gsap.timeline();
  const particles: HTMLDivElement[] = [];

  // Create particles
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement("div");
    const size = Math.random() * 15 + 5;
    particle.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      border-radius: 50%;
      left: ${centerX}px;
      top: ${centerY}px;
      pointer-events: none;
      z-index: 50;
      box-shadow: 0 0 ${size}px ${color};
    `;
    container.appendChild(particle);
    particles.push(particle);
  }

  // Animate particles outward
  particles.forEach((particle, i) => {
    const angle = (i / particleCount) * Math.PI * 2;
    const distance = 100 + Math.random() * 150;
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;

    timeline.to(
      particle,
      {
        x,
        y,
        opacity: 0,
        scale: 0,
        duration: duration,
        ease: "power2.out",
        onComplete: () => particle.remove(),
      },
      0
    );
  });

  return timeline;
}

/**
 * Create a magic circle effect around element
 */
export function createMagicCircle(
  element: HTMLElement | null,
  container: HTMLElement | null,
  options: {
    size?: number;
    duration?: number;
    color?: string;
  } = {}
): { element: HTMLDivElement; timeline: gsap.core.Timeline } | null {
  if (!element || !container) return null;

  const { size = 200, duration = 0.3, color = "#8B5CF6" } = options;

  const rect = element.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  const centerX = rect.left - containerRect.left + rect.width / 2;
  const centerY = rect.top - containerRect.top + rect.height / 2;

  const circle = document.createElement("div");
  circle.style.cssText = `
    position: absolute;
    width: ${size}px;
    height: ${size}px;
    left: ${centerX - size / 2}px;
    top: ${centerY - size / 2}px;
    border: 4px solid ${color};
    border-radius: 50%;
    pointer-events: none;
    z-index: 40;
    opacity: 0;
    box-shadow: 0 0 30px ${color}, inset 0 0 30px ${color};
  `;
  container.appendChild(circle);

  const timeline = gsap.timeline();
  timeline.fromTo(
    circle,
    { scale: 0, opacity: 0, rotation: 0 },
    {
      scale: 1,
      opacity: 1,
      rotation: 180,
      duration: duration,
      ease: "back.out(1.5)",
    }
  );

  return { element: circle, timeline };
}

/**
 * Create energy projectile effect
 */
export function createEnergyProjectile(
  from: HTMLElement | null,
  to: HTMLElement | null,
  container: HTMLElement | null,
  options: {
    size?: number;
    duration?: number;
    color?: string;
    trailCount?: number;
  } = {}
): gsap.core.Timeline | null {
  if (!from || !to || !container) return null;

  const {
    size = 40,
    duration = 0.3,
    color = "#F97316",
    trailCount = 5,
  } = options;

  const fromRect = from.getBoundingClientRect();
  const toRect = to.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();

  const startX = fromRect.left - containerRect.left + fromRect.width / 2;
  const startY = fromRect.top - containerRect.top + fromRect.height / 2;
  const endX = toRect.left - containerRect.left + toRect.width / 2;
  const endY = toRect.top - containerRect.top + toRect.height / 2;

  // Create main projectile
  const projectile = document.createElement("div");
  projectile.style.cssText = `
    position: absolute;
    width: ${size}px;
    height: ${size}px;
    left: ${startX - size / 2}px;
    top: ${startY - size / 2}px;
    background: radial-gradient(circle, white 0%, ${color} 50%, transparent 100%);
    border-radius: 50%;
    pointer-events: none;
    z-index: 60;
    box-shadow: 0 0 ${size}px ${color}, 0 0 ${size * 2}px ${color};
  `;
  container.appendChild(projectile);

  // Create trail particles
  const trails: HTMLDivElement[] = [];
  for (let i = 0; i < trailCount; i++) {
    const trail = document.createElement("div");
    const trailSize = size * (1 - i * 0.15);
    trail.style.cssText = `
      position: absolute;
      width: ${trailSize}px;
      height: ${trailSize}px;
      left: ${startX - trailSize / 2}px;
      top: ${startY - trailSize / 2}px;
      background: ${color};
      border-radius: 50%;
      pointer-events: none;
      z-index: ${59 - i};
      opacity: ${0.6 - i * 0.1};
    `;
    container.appendChild(trail);
    trails.push(trail);
  }

  const timeline = gsap.timeline();

  // Animate main projectile
  timeline.to(projectile, {
    left: endX - size / 2,
    top: endY - size / 2,
    duration: duration,
    ease: "power2.in",
    onComplete: () => projectile.remove(),
  });

  // Animate trails with delay
  trails.forEach((trail, i) => {
    const trailSize = size * (1 - i * 0.15);
    timeline.to(
      trail,
      {
        left: endX - trailSize / 2,
        top: endY - trailSize / 2,
        opacity: 0,
        duration: duration,
        ease: "power2.in",
        onComplete: () => trail.remove(),
      },
      i * 0.02
    );
  });

  return timeline;
}

/**
 * Create impact explosion effect
 */
export function createImpactExplosion(
  element: HTMLElement | null,
  container: HTMLElement | null,
  options: {
    size?: number;
    duration?: number;
    color?: string;
  } = {}
): gsap.core.Timeline | null {
  if (!element || !container) return null;

  const { size = 150, duration = 0.2, color = "#FBBF24" } = options;

  const rect = element.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  const centerX = rect.left - containerRect.left + rect.width / 2;
  const centerY = rect.top - containerRect.top + rect.height / 2;

  // Create explosion ring
  const ring = document.createElement("div");
  ring.style.cssText = `
    position: absolute;
    width: ${size}px;
    height: ${size}px;
    left: ${centerX - size / 2}px;
    top: ${centerY - size / 2}px;
    border: 8px solid ${color};
    border-radius: 50%;
    pointer-events: none;
    z-index: 70;
    opacity: 1;
    box-shadow: 0 0 40px ${color};
  `;
  container.appendChild(ring);

  // Create center flash
  const flash = document.createElement("div");
  flash.style.cssText = `
    position: absolute;
    width: ${size * 0.5}px;
    height: ${size * 0.5}px;
    left: ${centerX - (size * 0.5) / 2}px;
    top: ${centerY - (size * 0.5) / 2}px;
    background: radial-gradient(circle, white 0%, ${color} 100%);
    border-radius: 50%;
    pointer-events: none;
    z-index: 71;
    opacity: 1;
  `;
  container.appendChild(flash);

  const timeline = gsap.timeline();

  // Expand ring
  timeline.fromTo(
    ring,
    { scale: 0, opacity: 1 },
    {
      scale: 2,
      opacity: 0,
      duration: duration,
      ease: "power2.out",
      onComplete: () => ring.remove(),
    }
  );

  // Flash and fade
  timeline.fromTo(
    flash,
    { scale: 1, opacity: 1 },
    {
      scale: 0.5,
      opacity: 0,
      duration: duration * 0.7,
      ease: "power2.out",
      onComplete: () => flash.remove(),
    },
    0
  );

  return timeline;
}
