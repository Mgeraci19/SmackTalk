import { MutationCtx } from "../_generated/server";
import { Id, Doc } from "../_generated/dataModel";
import { api } from "../_generated/api";

// Helper function to ensure HP is always a valid number
export function sanitizeHP(hp: number | undefined | null): number {
    if (hp === undefined || hp === null || isNaN(hp)) {
        console.warn(`[GAME] Invalid HP detected: ${hp}, returning 100`);
        return 100;
    }
    return Math.max(0, Math.floor(hp));
}

export async function resolveBattle(
    ctx: MutationCtx,
    gameId: Id<"games">,
    promptId: Id<"prompts">,
    currentRound: number
) {
    const votes = await ctx.db.query("votes").withIndex("by_prompt", q => q.eq("promptId", promptId)).collect();
    const submissions = await ctx.db.query("submissions").withIndex("by_prompt", q => q.eq("promptId", promptId)).collect();

    const totalVotes = votes.length;
    const DAMAGE_CAP = 35;

    // Round multipliers for damage scaling
    const getRoundMultiplier = (round: number): number => {
        switch (round) {
            case 1: return 1.0;   // 35 max damage
            case 2: return 1.3;   // 45.5 max damage (harder to survive)
            case 3: return 1.0;   // 35 max damage
            case 4: return 1.5;   // 52.5 max damage (sudden death)
            default: return 1.0;
        }
    };

    // Safety check: If no votes were cast, skip damage calculation
    if (totalVotes === 0) {
        console.warn(`[GAME] No votes cast for prompt ${promptId}. Skipping damage calculation.`);
        // Still need to update players to avoid stale state, but with 0 damage
        for (const sub of submissions) {
            const player = await ctx.db.get(sub.playerId);
            if (player) {
                const currentHp = sanitizeHP(player.hp);
                console.log(`[GAME] ${player.name}: HP unchanged at ${currentHp} (no votes)`);
                await ctx.db.patch(player._id, { hp: currentHp, knockedOut: false });
            }
        }
        return;
    }

    // Normal damage calculation when votes exist
    // Map submissions to vote counts and player data
    const subsWithVotes = await Promise.all(submissions.map(async sub => {
        const votesFor = votes.filter(v => v.submissionId === sub._id).length;
        const player = await ctx.db.get(sub.playerId);
        return { sub, votesFor, player };
    }));

    // Check for tie scenario (both have same votes)
    const isTie = subsWithVotes.length === 2 &&
        subsWithVotes[0].votesFor === subsWithVotes[1].votesFor;

    if (isTie) {
        // In a tie, both take equal damage (50% of DAMAGE_CAP)
        let damage = 0.5 * DAMAGE_CAP * getRoundMultiplier(currentRound);

        // Calculate if both would be KO'd
        const results = subsWithVotes.map(({ sub, player }) => {
            const currentHp = sanitizeHP(player?.hp);
            const newHp = Math.max(0, Math.floor(currentHp - damage));
            return { sub, player, currentHp, newHp, wouldKO: newHp === 0 };
        });

        const bothKO = results.every(r => r.wouldKO);

        if (bothKO) {
            // DOUBLE KO TIE - Shorter answer survives!
            const [r1, r2] = results;
            const len1 = r1.sub.text.length;
            const len2 = r2.sub.text.length;

            let winner, loser;

            if (len1 !== len2) {
                // Shorter answer wins
                winner = len1 < len2 ? r1 : r2;
                loser = len1 < len2 ? r2 : r1;
                console.log(`[GAME] DOUBLE KO TIE! Shorter answer wins: ${winner.player?.name} (${len1 < len2 ? len1 : len2} chars) beats ${loser.player?.name} (${len1 < len2 ? len2 : len1} chars)`);
            } else {
                // Same length - first submission wins (submitted faster)
                winner = r1.sub._creationTime < r2.sub._creationTime ? r1 : r2;
                loser = r1.sub._creationTime < r2.sub._creationTime ? r2 : r1;
                console.log(`[GAME] DOUBLE KO TIE! Same length (${len1} chars) - faster submission wins: ${winner.player?.name} submitted first`);
            }

            // Winner takes damage but survives with 1 HP (still counts as a loss in tie)
            if (winner.player) {
                const currentStreak = winner.player.lossStreak || 0;
                await ctx.db.patch(winner.player._id, { hp: 1, knockedOut: false, lossStreak: currentStreak + 1 });
            }

            // Loser gets KO'd
            if (loser.player) {
                const currentStreak = loser.player.lossStreak || 0;
                const opponentSub = submissions.find(s => s.playerId !== loser.player!._id);
                if (opponentSub && (currentRound === 1 || currentRound === 2)) {
                    const winnerId = opponentSub.playerId;
                    console.log(`[GAME] Round ${currentRound}: ${loser.player.name} KO'd! Assigning as Corner Man for ${winnerId}`);
                    await ctx.db.patch(loser.player._id, { role: "CORNER_MAN", teamId: winnerId, hp: 0, knockedOut: true, lossStreak: currentStreak + 1 });
                } else {
                    console.log(`[GAME] Player ${loser.player.name} KO'd in Round ${currentRound}!`);
                    await ctx.db.patch(loser.player._id, { hp: 0, knockedOut: true, lossStreak: currentStreak + 1 });
                }
            }
        } else {
            // Normal tie - apply equal damage to both (both count as losses)
            for (const r of results) {
                if (r.player) {
                    const currentStreak = r.player.lossStreak || 0;
                    console.log(`[GAME] TIE: ${r.player.name}: ${r.currentHp} HP - ${Math.floor(damage)} damage = ${r.newHp} HP (streak: ${currentStreak + 1})`);
                    await ctx.db.patch(r.player._id, { hp: r.newHp, knockedOut: r.wouldKO, lossStreak: currentStreak + 1 });
                }
            }
        }
    } else {
        // Non-tie: Only the loser takes damage
        // Sort by votes (Ascending = Loser first)
        subsWithVotes.sort((a, b) => a.votesFor - b.votesFor);

        const loser = subsWithVotes[0];
        const winner = subsWithVotes[1];

        // Calculate damage for loser based on vote proportions
        const votesAgainst = totalVotes - loser.votesFor;
        let damage = (votesAgainst / totalVotes) * DAMAGE_CAP * getRoundMultiplier(currentRound);

        // Apply damage to loser
        if (loser.player) {
            const currentHp = sanitizeHP(loser.player.hp);
            const currentStreak = loser.player.lossStreak || 0;
            const newStreak = currentStreak + 1;

            // COMBO KO: 3 straight losses in Round 1 = auto KO
            let knockedOut = false;
            let newHp = Math.max(0, Math.floor(currentHp - damage));

            if (currentRound === 1 && newStreak >= 3) {
                knockedOut = true;
                newHp = 0;
                console.log(`[COMBO KO!!!] ${loser.player.name} lost 3 straight battles in Round 1! Auto-KO!`);
            } else {
                knockedOut = newHp === 0;
            }

            console.log(`[GAME] ${loser.player.name}: ${currentHp} HP - ${Math.floor(damage)} damage = ${newHp} HP (${loser.votesFor}/${totalVotes} votes, streak: ${newStreak})`);

            if (knockedOut) {
                const opponentSub = submissions.find(s => s.playerId !== loser.player!._id);

                // Corner Man Assignment for Rounds 1 and 2
                if (opponentSub && (currentRound === 1 || currentRound === 2)) {
                    const winnerId = opponentSub.playerId;

                    const existingCornerMen = await ctx.db.query("players")
                        .withIndex("by_game", q => q.eq("gameId", gameId))
                        .filter(q => q.eq(q.field("teamId"), winnerId) && q.eq(q.field("role"), "CORNER_MAN"))
                        .collect();

                    if (existingCornerMen.length >= 1) {
                        console.warn(`[GAME] WARNING: ${loser.player.name} lost to ${winnerId} who already has ${existingCornerMen.length} corner men! This violates bye logic. Assigning anyway as second corner man.`);
                        await ctx.db.patch(loser.player._id, { role: "CORNER_MAN", teamId: winnerId, hp: newHp, knockedOut, lossStreak: newStreak });
                        console.log(`[CORNER MAN ASSIGNED] ${loser.player.name} (ID: ${loser.player._id}) → Supporting ${winnerId}`);
                    } else {
                        console.log(`[GAME] Round ${currentRound}: ${loser.player.name} KO'd! Assigning as Corner Man for ${winnerId}`);
                        await ctx.db.patch(loser.player._id, { role: "CORNER_MAN", teamId: winnerId, hp: newHp, knockedOut, lossStreak: newStreak });
                        console.log(`[CORNER MAN ASSIGNED] ${loser.player.name} (ID: ${loser.player._id}) → Supporting ${winnerId}`);
                    }
                } else {
                    console.log(`[GAME] Player ${loser.player.name} KO'd in Round ${currentRound}!`);
                    await ctx.db.patch(loser.player._id, { hp: newHp, knockedOut, lossStreak: newStreak });
                }
            } else {
                // Not KO'd - update HP and loss streak
                await ctx.db.patch(loser.player._id, { hp: newHp, knockedOut, lossStreak: newStreak });
            }
        }

        // Winner takes no damage - reset loss streak
        if (winner.player) {
            const currentHp = sanitizeHP(winner.player.hp);
            console.log(`[GAME] ${winner.player.name}: ${currentHp} HP (WINNER - no damage, ${winner.votesFor}/${totalVotes} votes, streak reset)`);
            await ctx.db.patch(winner.player._id, { hp: currentHp, knockedOut: false, lossStreak: 0 });
        }
    }
}
