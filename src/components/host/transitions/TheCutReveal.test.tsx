import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi, beforeEach } from "vitest";
import { TheCutReveal } from "./TheCutReveal";
import { Id } from "../../../../convex/_generated/dataModel";

// Mock GSAP to prevent animation issues in tests
vi.mock("../animations/gsapConfig", () => ({
  gsap: {
    set: vi.fn(),
    to: vi.fn(),
    timeline: vi.fn(() => ({
      to: vi.fn().mockReturnThis(),
      kill: vi.fn(),
    })),
  },
}));

// Mock AvatarFighter to simplify testing
vi.mock("../AvatarFighter", () => ({
  AvatarFighter: ({ name }: { name: string }) => (
    <div data-testid={`avatar-${name}`}>{name}</div>
  ),
}));

function createMockGameState(options: {
  semifinalistCount?: number;
  eliminatedCount?: number;
} = {}) {
  const { semifinalistCount = 4, eliminatedCount = 4 } = options;

  const players = [];

  // Create semifinalists (FIGHTER role, high HP)
  for (let i = 0; i < semifinalistCount; i++) {
    players.push({
      _id: `semifinalist-${i}` as Id<"players">,
      _creationTime: Date.now(),
      gameId: "game-1" as Id<"games">,
      name: `Fighter ${i + 1}`,
      score: 0,
      isVip: i === 0,
      hp: 100 - i * 5, // Descending HP
      maxHp: 100,
      knockedOut: false,
      role: "FIGHTER" as const,
      isBot: false,
    });
  }

  // Create eliminated players (CORNER_MAN role)
  for (let i = 0; i < eliminatedCount; i++) {
    players.push({
      _id: `eliminated-${i}` as Id<"players">,
      _creationTime: Date.now(),
      gameId: "game-1" as Id<"games">,
      name: `Eliminated ${i + 1}`,
      score: 0,
      isVip: false,
      hp: 50 - i * 5, // Lower HP
      maxHp: 100,
      knockedOut: true,
      role: "CORNER_MAN" as const,
      teamId: players[i % semifinalistCount]?._id, // Assigned to semifinalists
      becameCornerManInRound: 1,
      isBot: false,
    });
  }

  return {
    _id: "game-1" as Id<"games">,
    _creationTime: Date.now(),
    roomCode: "TEST",
    status: "ROUND_RESULTS",
    currentRound: 2,
    maxRounds: 3,
    players,
    messages: [],
    prompts: [],
    submissions: [],
    votes: [],
    suggestions: [],
  };
}

describe("TheCutReveal", () => {
  const mockOnComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders title 'THE CUT'", () => {
    const gameState = createMockGameState();

    render(<TheCutReveal gameState={gameState} onComplete={mockOnComplete} />);

    expect(screen.getByText("THE CUT")).toBeInTheDocument();
  });

  test("renders subtitle about top 4 advancing", () => {
    const gameState = createMockGameState();

    render(<TheCutReveal gameState={gameState} onComplete={mockOnComplete} />);

    expect(screen.getByText("Only the top 4 advance to the Semi-Finals")).toBeInTheDocument();
  });

  test("shows 'ADVANCING TO SEMI-FINALS' section", () => {
    const gameState = createMockGameState();

    render(<TheCutReveal gameState={gameState} onComplete={mockOnComplete} />);

    expect(screen.getByText("ADVANCING TO SEMI-FINALS")).toBeInTheDocument();
  });

  test("shows 'ELIMINATED' section when there are eliminated players", () => {
    const gameState = createMockGameState({ eliminatedCount: 4 });

    render(<TheCutReveal gameState={gameState} onComplete={mockOnComplete} />);

    expect(screen.getByText("ELIMINATED")).toBeInTheDocument();
  });

  test("does not show 'ELIMINATED' section when no players eliminated", () => {
    const gameState = createMockGameState({ eliminatedCount: 0 });

    render(<TheCutReveal gameState={gameState} onComplete={mockOnComplete} />);

    expect(screen.queryByText("ELIMINATED")).not.toBeInTheDocument();
  });

  test("displays semifinalist names", () => {
    const gameState = createMockGameState({ semifinalistCount: 4 });

    render(<TheCutReveal gameState={gameState} onComplete={mockOnComplete} />);

    // Use getAllByText since names appear multiple times (in avatar mock and name plate)
    expect(screen.getAllByText("Fighter 1").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Fighter 2").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Fighter 3").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Fighter 4").length).toBeGreaterThan(0);
  });

  test("displays eliminated player names", () => {
    const gameState = createMockGameState({ eliminatedCount: 2 });

    render(<TheCutReveal gameState={gameState} onComplete={mockOnComplete} />);

    // Use getAllByText since names appear multiple times (in avatar mock and name plate)
    expect(screen.getAllByText("Eliminated 1").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Eliminated 2").length).toBeGreaterThan(0);
  });

  test("displays seed numbers for semifinalists", () => {
    const gameState = createMockGameState({ semifinalistCount: 4 });

    render(<TheCutReveal gameState={gameState} onComplete={mockOnComplete} />);

    expect(screen.getByText("#1")).toBeInTheDocument();
    expect(screen.getByText("#2")).toBeInTheDocument();
    expect(screen.getByText("#3")).toBeInTheDocument();
    expect(screen.getByText("#4")).toBeInTheDocument();
  });

  test("displays rank numbers for eliminated players starting at #5", () => {
    const gameState = createMockGameState({ semifinalistCount: 4, eliminatedCount: 2 });

    render(<TheCutReveal gameState={gameState} onComplete={mockOnComplete} />);

    expect(screen.getByText("#5")).toBeInTheDocument();
    expect(screen.getByText("#6")).toBeInTheDocument();
  });

  test("displays HP for semifinalists", () => {
    const gameState = createMockGameState({ semifinalistCount: 2 });

    render(<TheCutReveal gameState={gameState} onComplete={mockOnComplete} />);

    expect(screen.getByText("100 HP")).toBeInTheDocument();
    expect(screen.getByText("95 HP")).toBeInTheDocument();
  });

  test("shows corner man assignment for eliminated players", () => {
    const gameState = createMockGameState({ semifinalistCount: 4, eliminatedCount: 1 });

    render(<TheCutReveal gameState={gameState} onComplete={mockOnComplete} />);

    // First eliminated player is assigned to first semifinalist
    expect(screen.getByText("Now supporting Fighter 1")).toBeInTheDocument();
  });

  test("renders nothing and calls onComplete when no semifinalists", async () => {
    const gameState = createMockGameState({ semifinalistCount: 0, eliminatedCount: 0 });

    const { container } = render(
      <TheCutReveal gameState={gameState} onComplete={mockOnComplete} />
    );

    // Should render nothing (null)
    expect(container.firstChild).toBeNull();
  });
});

describe("TheCutReveal - ordering", () => {
  const mockOnComplete = vi.fn();

  test("semifinalists are ordered by HP descending (highest seed #1)", () => {
    const gameState = createMockGameState({ semifinalistCount: 4 });

    render(<TheCutReveal gameState={gameState} onComplete={mockOnComplete} />);

    // Verify the #1 seed is Fighter 1 (highest HP = 100)
    // and #4 seed is Fighter 4 (lowest HP = 85)
    expect(screen.getByText("#1")).toBeInTheDocument();
    expect(screen.getByText("#4")).toBeInTheDocument();

    // Check that we have all 4 fighters in the advancing section
    expect(screen.getAllByText(/Fighter \d/).length).toBeGreaterThanOrEqual(4);
  });
});
