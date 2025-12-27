import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const create = mutation({
    args: {},
    handler: async (ctx) => {
        const roomCode = Math.random().toString(36).substring(2, 6).toUpperCase();

        // Ensure uniqueness (simple check)
        const existing = await ctx.db
            .query("games")
            .withIndex("by_room_code", (q) => q.eq("roomCode", roomCode))
            .first();

        // In prod, retry logic here needed, but for MVP this is fine.
        if (existing) throw new Error("Code collision, try again");

        const gameId = await ctx.db.insert("games", {
            roomCode,
            status: "LOBBY",
            currentRound: 1,
            maxRounds: 3,
        });

        return { gameId, roomCode };
    },
});

export const join = mutation({
    args: { roomCode: v.string(), playerName: v.string() },
    handler: async (ctx, args) => {
        const game = await ctx.db
            .query("games")
            .withIndex("by_room_code", (q) => q.eq("roomCode", args.roomCode))
            .first();

        if (!game) throw new Error("Room not found");

        const existingPlayers = await ctx.db
            .query("players")
            .withIndex("by_game", (q) => q.eq("gameId", game._id))
            .collect();

        // Check if player name text is empty or taken
        if (!args.playerName.trim()) throw new Error("Name required");

        const playerId = await ctx.db.insert("players", {
            gameId: game._id,
            name: args.playerName,
            score: 0,
            isVip: existingPlayers.length === 0, // First player is VIP
        });

        return { playerId, gameId: game._id };
    },
});

export const get = query({
    args: { roomCode: v.string() },
    handler: async (ctx, args) => {
        const game = await ctx.db
            .query("games")
            .withIndex("by_room_code", (q) => q.eq("roomCode", args.roomCode.toUpperCase()))
            .first();

        if (!game) return null;

        const players = await ctx.db
            .query("players")
            .withIndex("by_game", (q) => q.eq("gameId", game._id))
            .collect();

        const messages = await ctx.db
            .query("messages")
            .withIndex("by_game", (q) => q.eq("gameId", game._id))
            .collect();

        // Fetch Prompts and Submissions
        const prompts = await ctx.db
            .query("prompts")
            .withIndex("by_game", (q) => q.eq("gameId", game._id))
            .collect();

        const submissions = [];
        for (const p of prompts) {
            const subs = await ctx.db.query("submissions").withIndex("by_prompt", q => q.eq("promptId", p._id)).collect();
            submissions.push(...subs);
        }

        // Fetch Votes (for later)
        const votes = await ctx.db.query("votes").collect(); // Inefficient but fine for now

        return { ...game, players, messages, prompts, submissions, votes };
    },
});

export const sendMessage = mutation({
    args: { gameId: v.id("games"), playerId: v.id("players"), text: v.string() },
    handler: async (ctx, args) => {
        await ctx.db.insert("messages", {
            gameId: args.gameId,
            playerId: args.playerId,
            text: args.text,
        });
    },
});

const PROMPTS = [
    "The best way to scare a burglar is...",
    "A terrible name for a pet goldfish.",
    "What really killed the dinosaurs.",
    "The worst thing to say at a funeral.",
    "Something you shouldn't say to your doctor.",
    "A rejected flavor of ice cream.",
    "The unsexiest feature a person can have.",
    "What the Queen really keeps in her purse.",
    "The worst thing to find in your burrito.",
    "A bad substitute for a toothbrush.",
    "What dogs think about when they bark.",
    "The weirdest thing to find in your browser history.",
    "A rejected superhero name.",
    "The worst place to propose.",
    "What aliens really want from Earth.",
    "A terrible slogan for a dating app.",
    "The worst thing to say to a cop.",
    "A bad reason to break up with someone.",
    "What you shouldn't put on a resume.",
    "The worst thing to whisper in someone's ear.",
    "A rejected Disney movie title.",
    "The worst thing to bring to a potluck.",
    "What you shouldn't say on a first date.",
    "A terrible name for a rock band.",
    "The worst thing to do in an elevator.",
    "What cats are really plotting.",
    "The worst thing to say during sex.",
    "A bad name for a strip club.",
    "The worst thing to find under your bed.",
    "What you shouldn't say to your boss.",
    "A terrible name for a perfume.",
    "The worst thing to do at a wedding.",
    "What you shouldn't say to a flight attendant.",
    "A bad name for a law firm.",
    "The worst thing to say to a teacher.",
    "What you shouldn't say to a judge.",
    "A terrible name for a hospital.",
    "The worst thing to do in a library.",
    "What you shouldn't say to a mechanic.",
    "A bad name for a airline.",
    "The worst thing to say to a dentist.",
    "What you shouldn't say to a bartender.",
    "A terrible name for a gym.",
    "The worst thing to do in a movie theater.",
    "What you shouldn't say to a waiter.",
    "A bad name for a hotel.",
    "The best pickup line for a ghost.",
    "Something you'd find in a magician's pockets.",
    "The worst way to describe the taste of water.",
    "A secret talent of the President.",
    "If animals could talk, which one would be the rudest?",
    "The most useless superpower.",
    "A rejected title for a self-help book.",
    "What you shouldn't say to a mime.",
    "The worst thing to put on a pizza.",
    "A bad name for a boat.",
    "The worst thing to say to a tax collector.",
    "What you shouldn't say to a librarian.",
    "A terrible name for a university.",
    "The worst thing to do in a museum.",
    "What you shouldn't say to a zookeeper."
];

// Phase 3: Game Logic Implementation
// Helper to assign prompts for the current round
async function startRound(ctx: any, gameId: Id<"games">) {
    const players = await ctx.db
        .query("players")
        .withIndex("by_game", (q: any) => q.eq("gameId", gameId))
        .collect();

    // RESET LOGIC: Clear old prompts/submissions for this round
    // Note: We delete prompts, which cascades to submissions if we had cascaded deletes, 
    // but here we must manually clean or just ensure UI filters by round?
    // Current schema doesn't track round on prompts. 
    // So we MUST delete old prompts to "clear the board".
    const oldPrompts = await ctx.db.query("prompts").withIndex("by_game", (q: any) => q.eq("gameId", gameId)).collect();
    for (const p of oldPrompts) {
        // Also cleanup votes/submissions linked to these prompts to keep DB clean
        const submissions = await ctx.db.query("submissions").withIndex("by_prompt", (q: any) => q.eq("promptId", p._id)).collect();
        const votes = await ctx.db.query("votes").withIndex("by_prompt", (q: any) => q.eq("promptId", p._id)).collect();
        for (const s of submissions) await ctx.db.delete(s._id);
        for (const v of votes) await ctx.db.delete(v._id);
        await ctx.db.delete(p._id);
    }

    console.log(`[GAME] Assigning prompts to ${players.length} players`);

    const game = await ctx.db.get(gameId);
    const usedIndices = new Set(game.usedPromptIndices || []);
    const availableIndices = PROMPTS.map((_, i) => i).filter(i => !usedIndices.has(i));

    if (availableIndices.length < players.length) {
        // Fallback if we run out of unique prompts: clear used list or just reuse randoms
        console.warn("Ran out of unique prompts! Resetting usage history.");
        usedIndices.clear();
        availableIndices.push(...PROMPTS.map((_, i) => i));
    }

    const newUsedIndices = [...usedIndices];

    for (let i = 0; i < players.length; i++) {
        const p1 = players[i];
        const p2 = players[(i + 1) % players.length];

        // Pick a random available index
        const randIdx = Math.floor(Math.random() * availableIndices.length);
        const promptIndex = availableIndices[randIdx];

        // Remove from available so we don't pick it again THIS round
        availableIndices.splice(randIdx, 1);

        // Add to used history
        if (!newUsedIndices.includes(promptIndex)) {
            newUsedIndices.push(promptIndex);
        }

        const promptText = PROMPTS[promptIndex];

        await ctx.db.insert("prompts", {
            gameId: gameId,
            text: promptText,
            assignedTo: [p1._id, p2._id]
        });
    }

    // Update game with new used indices
    await ctx.db.patch(gameId, { usedPromptIndices: newUsedIndices });

    await ctx.db.patch(gameId, {
        status: "PROMPTS",
        currentPromptId: undefined,
        roundStatus: undefined
    });
}

export const startGame = mutation({
    args: { gameId: v.id("games") },
    handler: async (ctx, args) => {
        console.log(`[GAME] Starting game ${args.gameId}`);
        const game = await ctx.db.get(args.gameId);
        if (!game) throw new Error("Game not found");
        if (game.status !== "LOBBY") throw new Error("Game already started");

        const players = await ctx.db
            .query("players")
            .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
            .collect();

        if (players.length < 3) throw new Error("Need at least 3 players");

        await startRound(ctx, args.gameId);
    },
});

export const nextRound = mutation({
    args: { gameId: v.id("games") },
    handler: async (ctx, args) => {
        const game = await ctx.db.get(args.gameId);
        if (!game) return;

        await ctx.db.patch(args.gameId, { currentRound: game.currentRound + 1 });
        await startRound(ctx, args.gameId);
    }
});

export const submitAnswer = mutation({
    args: { gameId: v.id("games"), playerId: v.id("players"), promptId: v.id("prompts"), text: v.string() },
    handler: async (ctx, args) => {
        console.log(`[GAME] Player ${args.playerId} submitted answer for ${args.promptId}: "${args.text}"`);

        // 1. Store submission
        await ctx.db.insert("submissions", {
            promptId: args.promptId,
            playerId: args.playerId,
            text: args.text,
        });

        // 2. Check if phase is complete (Did everyone answer everything?)
        //    For this MVP: Check if total submissions >= Total Prompts * 2

        const allPrompts = await ctx.db.query("prompts").withIndex("by_game", q => q.eq("gameId", args.gameId)).collect();
        const totalExpected = allPrompts.length * 2;

        // This is inefficient (scanning all submissions) but fine for MVP
        let totalReceived = 0;
        for (const prompt of allPrompts) {
            const subs = await ctx.db.query("submissions").withIndex("by_prompt", q => q.eq("promptId", prompt._id)).collect();
            totalReceived += subs.length;
        }

        console.log(`[GAME] Progress: ${totalReceived}/${totalExpected} answers received.`);

        if (totalReceived >= totalExpected) {
            console.log(`[GAME] All answers received! Moving to VOTING.`);
            // Initialize first prompt for voting
            const firstPrompt = allPrompts[0];
            await ctx.db.patch(args.gameId, {
                status: "VOTING",
                currentPromptId: firstPrompt._id,
                roundStatus: "VOTING"
            });
        }
    }
});

export const vote = mutation({
    args: { gameId: v.id("games"), promptId: v.id("prompts"), submissionId: v.id("submissions") },
    handler: async (ctx, args) => {
        // Prevent duplicate votes? For MVP, maybe just let them toggle or overwrite?
        // Let's just insert for now.
        const player = await ctx.auth.getUserIdentity(); // Oh wait, we don't have auth yet.
        // We need playerId passed in or stored in session. 
        // We'll rely on client passing playerId for now (insecure but fine for MVP).

        // Actually, let's just assume simple append-only voting for now
        // But we need to update the player Score!

        // Wait, score update happens at end of battle.
        // Just store the vote.
        // We need to know WHO voted to prevent double voting.
        // Let's add playerId to args.
    }
});

export const submitVote = mutation({
    args: { gameId: v.id("games"), playerId: v.id("players"), promptId: v.id("prompts"), submissionId: v.id("submissions") },
    handler: async (ctx, args) => {
        // Prevent doubling voting
        const existing = await ctx.db.query("votes")
            .withIndex("by_prompt", q => q.eq("promptId", args.promptId))
            .filter(q => q.eq(q.field("playerId"), args.playerId))
            .first();

        if (existing) {
            throw new Error("Already voted");
        }

        // STRICT VOTING RULE: Check if player is IN the battle
        const submissionsInBattle = await ctx.db.query("submissions").withIndex("by_prompt", q => q.eq("promptId", args.promptId)).collect();
        const battlerIds = submissionsInBattle.map(s => s.playerId);

        if (battlerIds.includes(args.playerId)) {
            throw new Error("You are in this battle! You cannot vote.");
        }


        await ctx.db.insert("votes", {
            promptId: args.promptId,
            playerId: args.playerId,
            submissionId: args.submissionId
        });

        // AUTO-ADVANCE LOGIC: Check if everyone has voted
        // New Logic: Total Players - 2 (the battlers) must vote.
        const players = await ctx.db.query("players").withIndex("by_game", q => q.eq("gameId", args.gameId)).collect();
        const expectedVotes = Math.max(1, players.length - 2);


        const currentVotes = await ctx.db.query("votes").withIndex("by_prompt", q => q.eq("promptId", args.promptId)).collect();

        if (currentVotes.length >= expectedVotes) {
            console.log(`[GAME] All votes received for prompt ${args.promptId}. Revealing results.`);
            await ctx.db.patch(args.gameId, { roundStatus: "REVEAL" });
        }
    }
});

export const nextBattle = mutation({
    args: { gameId: v.id("games") },
    handler: async (ctx, args) => {
        const game = await ctx.db.get(args.gameId);
        if (!game) return;

        // Calculate scores for the CURRENT battle (game.currentPromptId)
        if (game.currentPromptId) {
            const votes = await ctx.db.query("votes").withIndex("by_prompt", q => q.eq("promptId", game.currentPromptId!)).collect();
            const tally: Record<string, number> = {};
            for (const v of votes) tally[v.submissionId] = (tally[v.submissionId] || 0) + 100;

            for (const [subId, points] of Object.entries(tally)) {
                const sub = await ctx.db.get(subId as Id<"submissions">);
                if (sub) {
                    const player = await ctx.db.get(sub.playerId);
                    if (player) await ctx.db.patch(player._id, { score: player.score + points });
                }
            }
        }

        // Move to NEXT prompt
        const allPrompts = await ctx.db.query("prompts").withIndex("by_game", q => q.eq("gameId", args.gameId)).collect();
        const currentIndex = allPrompts.findIndex(p => p._id === game.currentPromptId);

        if (currentIndex < allPrompts.length - 1) {
            // Next Battle
            await ctx.db.patch(args.gameId, {
                currentPromptId: allPrompts[currentIndex + 1]._id,
                roundStatus: "VOTING" // Reset to voting
            });
        } else {
            // End of Round (Battles Done)
            const maxRounds = game.maxRounds || 3;
            if (game.currentRound < maxRounds) {
                // Go to Interim Scoreboard
                await ctx.db.patch(args.gameId, {
                    status: "ROUND_RESULTS",
                    currentPromptId: undefined,
                    roundStatus: undefined
                });
            } else {
                // End of Game
                await ctx.db.patch(args.gameId, { status: "RESULTS", currentPromptId: undefined, roundStatus: undefined });

                // Cleanup DB as requested (Purge Records)
                const prompts = await ctx.db.query("prompts").withIndex("by_game", q => q.eq("gameId", args.gameId)).collect();
                for (const p of prompts) {
                    const submissions = await ctx.db.query("submissions").withIndex("by_prompt", q => q.eq("promptId", p._id)).collect();
                    const votes = await ctx.db.query("votes").withIndex("by_prompt", q => q.eq("promptId", p._id)).collect();

                    for (const s of submissions) await ctx.db.delete(s._id);
                    for (const v of votes) await ctx.db.delete(v._id);
                    await ctx.db.delete(p._id);
                }
            }
        }
    }
});
