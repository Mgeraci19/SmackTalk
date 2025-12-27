"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Id } from "../../../convex/_generated/dataModel";

function RoomContent() {
    const searchParams = useSearchParams();
    const roomCode = searchParams.get("code") || "";
    const router = useRouter();

    const [playerId, setPlayerId] = useState<Id<"players"> | null>(null);
    const [messageText, setMessageText] = useState("");

    // Only query if roomCode exists
    const game = useQuery(api.games.get, roomCode ? { roomCode } : "skip");

    const sendMessage = useMutation(api.games.sendMessage);
    const startGame = useMutation(api.games.startGame);
    const submitAnswer = useMutation(api.games.submitAnswer);
    const submitVote = useMutation(api.games.submitVote);
    const nextBattle = useMutation(api.games.nextBattle);
    const nextRound = useMutation(api.games.nextRound);

    // Local state for answers: { promptId: "answer text" }
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [submittedPrompts, setSubmittedPrompts] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!roomCode) {
            router.push("/");
            return;
        }

        // Client-side only check for storage
        const storedId = sessionStorage.getItem("playerId");
        if (!storedId) {
            // If we don't have an ID, maybe redirect to join?
            // For now, let's just alert or redirect
            router.push("/");
        } else {
            setPlayerId(storedId as Id<"players">);
        }
    }, [router, roomCode]);

    if (!roomCode) return null;

    if (game === undefined) {
        return <div className="text-center p-10">Loading Room logic...</div>;
    }

    if (game === null) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <h1 className="text-xl font-bold">Room {roomCode} not found</h1>
                <Button onClick={() => router.push("/")}>Go Home</Button>
            </div>
        );
    }

    const myPlayer = game.players.find(p => p._id === playerId);
    const isVip = myPlayer?.isVip;

    const handleSend = async () => {
        if (!messageText || !playerId) return;
        await sendMessage({ gameId: game._id, playerId, text: messageText });
        setMessageText("");
    };

    return (
        <div className="p-4 max-w-2xl mx-auto space-y-4 min-h-screen bg-gray-50">
            <Card>
                <CardHeader>
                    <CardTitle>Room {game.roomCode} ({game.status})</CardTitle>
                </CardHeader>
                <CardContent>
                    {game.status === "LOBBY" && (
                        <div className="space-y-4">
                            <h3 className="font-bold">Waiting for players...</h3>
                            <ul className="space-y-1 bg-white p-4 rounded border">
                                {game.players.map(p => (
                                    <li key={p._id} className="flex justify-between">
                                        <span>{p.name} {p._id === playerId && "(You)"}</span>
                                        {p.isVip && <span>👑</span>}
                                    </li>
                                ))}
                            </ul>
                            {isVip && (
                                <>
                                    {game.players.length < 3 && <div className="text-destructive font-bold mb-2 text-center text-sm">Need at least 3 players</div>}
                                    <Button
                                        className="w-full"
                                        size="lg"
                                        disabled={game.players.length < 3}
                                        onClick={() => startGame({ gameId: game._id }).catch((e: any) => alert(e.message))}
                                    >
                                        Start Game
                                    </Button>
                                </>
                            )}
                        </div>
                    )}

                    {game.status === "PROMPTS" && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center bg-yellow-100 p-4 rounded">
                                <div>
                                    <h2 className="text-2xl font-bold mb-2">WRITING PHASE</h2>
                                    <p>Answer these prompts creatively!</p>
                                </div>
                                {/* ADMIN RESET BUTTON (Temporary for Debugging) */}
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => startGame({ gameId: game._id }).catch((e: any) => alert(e.message))}
                                >
                                    Reset Phase
                                </Button>
                            </div>

                            {/* Debug Info */}
                            <div className="text-xs font-mono bg-gray-100 p-2 border rounded">
                                <p>PlayerId: {playerId}</p>
                                <p>Total Prompts: {game.prompts?.length}</p>
                                <p>My Prompts: {game.prompts?.filter((p: any) => p.assignedTo?.includes(playerId)).length}</p>
                            </div>

                            {game.prompts
                                ?.filter((p: any) => p.assignedTo?.includes(playerId))
                                .map((p: any) => {
                                    const isSubmitted = submittedPrompts.has(p._id);
                                    const dbSubmission = game.submissions?.find((s: any) => s.promptId === p._id && s.playerId === playerId);
                                    const done = isSubmitted || !!dbSubmission;

                                    return (
                                        <Card key={p._id} className={done ? "opacity-50" : ""}>
                                            <CardHeader><CardTitle className="text-lg">{p.text}</CardTitle></CardHeader>
                                            <CardContent>
                                                {done ? (
                                                    <div className="text-green-600 font-bold">Answer Submitted!</div>
                                                ) : (
                                                    <div className="flex gap-2">
                                                        <Input
                                                            placeholder="Your answer..."
                                                            value={answers[p._id] || ""}
                                                            onChange={(e) => setAnswers(prev => ({ ...prev, [p._id]: e.target.value }))}
                                                        />
                                                        <Button onClick={async () => {
                                                            if (!answers[p._id]) return;
                                                            await submitAnswer({
                                                                gameId: game._id,
                                                                playerId: playerId as Id<"players">,
                                                                promptId: p._id,
                                                                text: answers[p._id]
                                                            });
                                                            setSubmittedPrompts(prev => new Set(prev).add(p._id));
                                                        }}>
                                                            Submit
                                                        </Button>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    );
                                })}

                            {/* Show waiting status if done */}
                            {game.prompts?.filter((p: any) => p.assignedTo?.includes(playerId))
                                .every((p: any) => submittedPrompts.has(p._id) || game.submissions?.some((s: any) => s.promptId === p._id && s.playerId === playerId))
                                && (
                                    <div className="text-center animate-pulse mt-4">
                                        Waiting for other players to finish...
                                    </div>
                                )}
                        </div>
                    )}

                    {game.status === "VOTING" && (
                        <div className="space-y-6">
                            <div className="text-center p-4 bg-blue-100 rounded">
                                <h2 className="text-2xl font-bold mb-2">
                                    {game.roundStatus === "REVEAL" ? "RESULTS" : "VOTING PHASE"}
                                </h2>
                                {/* Show Next Button ONLY if in Reveal for VIP */}
                                {isVip && game.roundStatus === "REVEAL" && (
                                    <Button className="mt-2 w-full animate-bounce" size="lg" onClick={() => nextBattle({ gameId: game._id })}>
                                        Next Battle ⏭️
                                    </Button>
                                )}
                            </div>

                            {game.currentPromptId ? (
                                <div className="space-y-4">
                                    <div className="text-center mb-4">
                                        <div className="text-sm uppercase text-gray-500 font-bold tracking-wider">Voting For</div>
                                        <div className="text-xl font-bold text-center border p-6 rounded-xl bg-white shadow-lg mt-1">
                                            {game.prompts?.find((p: any) => p._id === game.currentPromptId)?.text}
                                        </div>
                                    </div>

                                    {/* Calculated State for Voting UI */}
                                    {(() => {
                                        const currentSubmissions = game.submissions?.filter((s: any) => s.promptId === game.currentPromptId) || [];
                                        const currentVotes = game.votes?.filter((v: any) => v.promptId === game.currentPromptId) || [];
                                        return (
                                            <>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {(() => {
                                                        // Find max votes
                                                        let maxVotes = -1;
                                                        currentSubmissions.forEach((s: any) => {
                                                            const count = currentVotes.filter((v: any) => v.submissionId === s._id).length;
                                                            if (count > maxVotes) maxVotes = count;
                                                        });
                                                        const hasVotes = currentVotes.length > 0;

                                                        return currentSubmissions.map((s: any) => {
                                                            const myVote = game.votes?.find((v: any) => v.promptId === game.currentPromptId && v.playerId === playerId);
                                                            const isMyVote = myVote?.submissionId === s._id;
                                                            const hasVoted = !!myVote;
                                                            const isMine = s.playerId === playerId;
                                                            const amIBattling = currentSubmissions.some((sub: any) => sub.playerId === playerId);

                                                            // REVEAL LOGIC
                                                            const isReveal = game.roundStatus === "REVEAL";
                                                            const canVote = !amIBattling && !isReveal;

                                                            const votesForThis = currentVotes.filter((v: any) => v.submissionId === s._id) || [];
                                                            const count = votesForThis.length;
                                                            const percentage = currentVotes.length ? Math.round((votesForThis.length / currentVotes.length) * 100) : 0;
                                                            const author = game.players.find((p: any) => p._id === s.playerId);
                                                            const isWinner = isReveal && hasVotes && count === maxVotes;

                                                            return (
                                                                <div key={s._id} className="relative">
                                                                    {isWinner && (
                                                                        <div className="absolute -top-3 -right-3 z-10 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full font-bold shadow-lg animate-bounce border-2 border-white transform rotate-12">
                                                                            WINNER!
                                                                        </div>
                                                                    )}
                                                                    <Button
                                                                        variant={isReveal ? (votesForThis.length > 0 ? "default" : "secondary") : (isMyVote ? "default" : "outline")}
                                                                        className={`h-48 w-full text-lg whitespace-normal cursor-pointer flex flex-col p-4
                                                                        ${!isReveal && isMyVote ? "bg-green-600 hover:bg-green-700 text-white ring-2 ring-green-400" : ""} 
                                                                        ${!isReveal && hasVoted ? "opacity-50" : "hover:bg-blue-50"}
                                                                        ${isWinner ? "ring-4 ring-yellow-400 bg-yellow-50 scale-105 transition-transform" : ""}
                                                                        ${!canVote && !isReveal ? "cursor-not-allowed opacity-60 grayscale" : ""}
                                                                    `}
                                                                        disabled={!canVote}
                                                                        onClick={() => canVote && submitVote({
                                                                            gameId: game._id,
                                                                            playerId: playerId as Id<"players">,
                                                                            promptId: game.currentPromptId!,
                                                                            submissionId: s._id
                                                                        }).catch((e) => alert(e.message))}
                                                                    >
                                                                        <span className={`font-bold text-xl ${isWinner ? "text-yellow-800" : ""}`}>"{s.text}"</span>

                                                                        {!isReveal && isMine && (
                                                                            <span className="text-xs mt-2 text-gray-500 uppercase font-bold tracking-widest">(Your Answer)</span>
                                                                        )}

                                                                        {!isReveal && isMyVote && " ✅"}

                                                                        {isReveal && (
                                                                            <div className="mt-4 text-sm w-full pt-4 border-t border-black/10">
                                                                                <div className="font-bold text-2xl mb-1">{percentage}%</div>
                                                                                <div className="text-xs opacity-75">by {author?.name}</div>
                                                                            </div>
                                                                        )}
                                                                    </Button>

                                                                    {isReveal && (
                                                                        <div className="mt-2 text-center text-xs text-gray-600">
                                                                            {votesForThis.length > 0 && <div className="font-bold mb-1">Voted for by:</div>}
                                                                            {votesForThis.map((v: any) => {
                                                                                const voter = game.players.find((p: any) => p._id === v.playerId);
                                                                                return <div key={v._id} className="bg-gray-200 rounded px-2 py-1 inline-block m-0.5">{voter?.name}</div>
                                                                            })}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        });
                                                    })()}
                                                </div>

                                                {!game.roundStatus || game.roundStatus === "VOTING" ? (
                                                    <>
                                                        {game.votes?.some((v: any) => v.promptId === game.currentPromptId && v.playerId === playerId) && (
                                                            <div className="text-center text-gray-500 italic animate-pulse mt-4">
                                                                Vote recorded! Waiting for others...
                                                            </div>
                                                        )}
                                                        {currentSubmissions.some((s: any) => s.playerId === playerId) && (
                                                            <div className="text-center text-orange-600 font-bold animate-pulse mt-4 bg-orange-100 p-2 rounded">
                                                                You are in this battle! You cannot vote. Spectating...
                                                            </div>
                                                        )}
                                                    </>
                                                ) : null}
                                            </>
                                        );
                                    })()}
                                </div>
                            ) : (
                                <div className="text-center p-10">
                                    Loading Battle...
                                    {/* Fallback if currentPromptId is missing but status is VOTING */}
                                    {isVip && <Button onClick={() => nextBattle({ gameId: game._id })}>Force Next</Button>}
                                </div>
                            )}
                        </div>
                    )}

                    {game.status === "ROUND_RESULTS" && (
                        <div className="text-center p-10 bg-indigo-100 rounded">
                            <h2 className="text-3xl font-bold mb-4">ROUND {game.currentRound} OVER</h2>
                            <p className="mb-8">Current Standings:</p>
                            <div className="space-y-2 bg-white p-4 rounded shadow-sm">
                                {game.players
                                    .sort((a: any, b: any) => b.score - a.score)
                                    .map((p: any, i: number) => (
                                        <div key={p._id} className="text-xl flex justify-between border-b last:border-0 pb-2 mb-2 last:mb-0 last:pb-0">
                                            <span>#{i + 1} {p.name} {p._id === playerId && "(You)"}</span>
                                            <span className="font-bold">{p.score} pts</span>
                                        </div>
                                    ))}
                            </div>

                            {isVip ? (
                                <Button
                                    className="mt-8 w-full animate-pulse"
                                    size="lg"
                                    onClick={() => nextRound({ gameId: game._id })}
                                >
                                    Start Round {game.currentRound + 1} ⏭️
                                </Button>
                            ) : (
                                <div className="mt-8 text-gray-500 italic">
                                    Waiting for VIP to start next round...
                                </div>
                            )}
                        </div>
                    )}

                    {game.status === "RESULTS" && (
                        <div className="text-center p-10 bg-green-100 rounded">
                            <h2 className="text-3xl font-bold">GAME OVER</h2>
                            <div className="mt-8 space-y-2">
                                {game.players
                                    .sort((a: any, b: any) => b.score - a.score)
                                    .map((p: any, i: number) => (
                                        <div key={p._id} className="text-xl flex justify-between border-b pb-2">
                                            <span>#{i + 1} {p.name}</span>
                                            <span className="font-bold">{p.score} pts</span>
                                        </div>
                                    ))}
                            </div>
                            {isVip && <Button className="mt-8" onClick={() => router.push("/")}>Back to Home</Button>}
                        </div>
                    )}

                    <div className="mt-8 border-t pt-4">
                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-4">Chat & Logs</h4>
                        <div className="space-y-4">
                            <div className="h-64 overflow-y-auto border p-4 rounded bg-white shadow-inner flex flex-col gap-2">
                                {game.messages && game.messages.length === 0 && <div className="text-gray-400 italic">No messages yet</div>}
                                {game.messages && game.messages.map((m: any, i: number) => {
                                    const sender = game.players.find(p => p._id === m.playerId)?.name || "Unknown";
                                    const isMe = m.playerId === playerId;
                                    return (
                                        <div key={i} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                                            <div className={`max-w-[80%] rounded p-2 text-sm ${isMe ? "bg-blue-600 text-white" : "bg-gray-200"}`}>
                                                <div className="font-bold text-xs opacity-75">{sender}</div>
                                                {m.text}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="flex gap-2">
                                <Input
                                    value={messageText}
                                    onChange={e => setMessageText(e.target.value)}
                                    placeholder="Type a message..."
                                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                                />
                                <Button onClick={handleSend}>Send</Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div >
    );
}

export default function RoomPage() {
    return (
        <Suspense fallback={<div className="text-center p-20">Loading Room...</div>}>
            <RoomContent />
        </Suspense>
    );
}
