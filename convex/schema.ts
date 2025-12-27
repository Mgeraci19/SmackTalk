import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  games: defineTable({
    roomCode: v.string(),
    status: v.string(), // "LOBBY" | "PROMPTS" | "VOTING" | "ROUND_RESULTS" | "RESULTS"
    currentRound: v.number(),
    maxRounds: v.optional(v.number()),
    currentPromptId: v.optional(v.id("prompts")),
    roundStatus: v.optional(v.string()), // "VOTING" | "REVEAL"
    usedPromptIndices: v.optional(v.array(v.number())), // Track used prompt indices
  }).index("by_room_code", ["roomCode"]),

  players: defineTable({
    gameId: v.id("games"),
    name: v.string(),
    score: v.number(),
    isVip: v.boolean(),
  }).index("by_game", ["gameId"]),

  // temporary for chat verification
  messages: defineTable({
    gameId: v.id("games"),
    playerId: v.id("players"),
    text: v.string(),
  }).index("by_game", ["gameId"]),

  // Phase 3: Game Logic Tables
  prompts: defineTable({
    gameId: v.id("games"),
    text: v.string(),
    assignedTo: v.optional(v.array(v.id("players"))), // The 2 players who must answer this
  }).index("by_game", ["gameId"]),

  submissions: defineTable({
    promptId: v.id("prompts"),
    playerId: v.id("players"),
    text: v.string(),
  }).index("by_prompt", ["promptId"]),

  votes: defineTable({
    promptId: v.id("prompts"),
    playerId: v.id("players"),
    submissionId: v.id("submissions"),
  }).index("by_prompt", ["promptId"]),
});
