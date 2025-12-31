import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Id } from "../../../../convex/_generated/dataModel";
import { GameState } from "@/lib/types";
import { useState } from "react";
import { AttackType, ATTACK_TYPES } from "./PromptCard";

interface SuggestionCardProps {
    prompt: { _id: Id<"prompts">; text: string };
    game: GameState;
    playerId: Id<"players"> | null;
    sessionToken: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    submitSuggestion: (args: { gameId: Id<"games">; playerId: Id<"players">; sessionToken: string; promptId: Id<"prompts">; text: string }) => Promise<any>;
    captainIsBot?: boolean;
    captainId: Id<"players"> | undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    submitAnswerForBot: (args: { gameId: Id<"games">; playerId: Id<"players">; sessionToken: string; promptId: Id<"prompts">; text: string; attackType?: AttackType }) => Promise<any>;
    showError: (code: string, message: string) => void;
    /** Show attack type selector (only in Final round for bot captains) */
    showAttackTypeSelector?: boolean;
}

export function SuggestionCard({ prompt, game, playerId, sessionToken, submitSuggestion, captainIsBot, captainId, submitAnswerForBot, showError, showAttackTypeSelector }: SuggestionCardProps) {
    const [suggestionText, setSuggestionText] = useState("");
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [selectedAttackType, setSelectedAttackType] = useState<AttackType>("jab");

    const mySuggestions = game.suggestions?.filter((s) => s.promptId === prompt._id && s.senderId === playerId) || [];
    const promptIdSafe = prompt._id;

    // Check if Captain has ALREADY submitted
    const captainSubmission = game.submissions?.find((s) => s.promptId === prompt._id && s.playerId === captainId);
    if (captainSubmission) {
        return (
            <Card
                id={`corner-prompt-card-${promptIdSafe}`}
                data-prompt-id={prompt._id}
                data-status="captain-submitted"
                className="opacity-75 bg-gray-50"
            >
                <CardHeader><CardTitle className="text-lg">{prompt.text}</CardTitle></CardHeader>
                <CardContent>
                    <div id={`corner-submitted-${promptIdSafe}`} className="text-green-600 font-bold">Answer Submitted by Team!</div>
                    <div className="text-sm text-gray-500 mt-1">&ldquo;{captainSubmission.text}&rdquo;</div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card
            id={`corner-prompt-card-${promptIdSafe}`}
            data-prompt-id={prompt._id}
            data-status="pending"
            data-captain-is-bot={captainIsBot}
        >
            <CardHeader><CardTitle className="text-lg">{prompt.text}</CardTitle></CardHeader>
            <CardContent>
                {/* Attack Type Selector (Final round only, for bot captains) */}
                {showAttackTypeSelector && captainIsBot && (
                    <div
                        id={`attack-type-selector-${promptIdSafe}`}
                        data-testid={`attack-type-selector-${promptIdSafe}`}
                        className="space-y-2 mb-3"
                    >
                        <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                            Choose Attack for Bot
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {ATTACK_TYPES.map((attack) => {
                                const isSelected = selectedAttackType === attack.type;
                                const riskColors = {
                                    low: "border-green-500 bg-green-50 hover:bg-green-100",
                                    medium: "border-yellow-500 bg-yellow-50 hover:bg-yellow-100",
                                    high: "border-red-500 bg-red-50 hover:bg-red-100"
                                };
                                const selectedColors = {
                                    low: "border-green-600 bg-green-200 ring-2 ring-green-400",
                                    medium: "border-yellow-600 bg-yellow-200 ring-2 ring-yellow-400",
                                    high: "border-red-600 bg-red-200 ring-2 ring-red-400"
                                };

                                return (
                                    <button
                                        key={attack.type}
                                        id={`attack-type-${attack.type}-${promptIdSafe}`}
                                        data-testid={`attack-type-${attack.type}-${promptIdSafe}`}
                                        data-attack-type={attack.type}
                                        data-selected={isSelected}
                                        type="button"
                                        className={`p-2 rounded-lg border-2 text-center transition-all ${
                                            isSelected
                                                ? selectedColors[attack.riskLevel]
                                                : riskColors[attack.riskLevel]
                                        }`}
                                        onClick={() => setSelectedAttackType(attack.type)}
                                        aria-pressed={isSelected}
                                        aria-label={`${attack.label}: Deal ${attack.dealtMultiplier} damage, receive ${attack.receivedMultiplier} damage`}
                                    >
                                        <div className="font-bold text-sm">{attack.label}</div>
                                        <div className="text-xs text-gray-600">
                                            Deal {attack.dealtMultiplier} / Take {attack.receivedMultiplier}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                        <p className="text-xs text-gray-500 italic text-center">
                            {ATTACK_TYPES.find(a => a.type === selectedAttackType)?.description}
                        </p>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                        id={`corner-suggestion-input-${promptIdSafe}`}
                        data-testid={`corner-suggestion-input-${promptIdSafe}`}
                        data-prompt-id={prompt._id}
                        aria-label={captainIsBot ? `Type answer for Bot captain: ${prompt.text}` : `Suggest an answer for: ${prompt.text}`}
                        placeholder={captainIsBot ? "Type answer for Bot..." : "Suggest an answer..."}
                        value={suggestionText}
                        onChange={e => setSuggestionText(e.target.value)}
                        disabled={isSubmitted}
                    />
                    <Button
                        id={`corner-suggest-button-${promptIdSafe}`}
                        data-testid={`corner-suggest-button-${promptIdSafe}`}
                        data-action="submit-suggestion"
                        data-prompt-id={prompt._id}
                        aria-label={`Suggest answer for: ${prompt.text}`}
                        // VALIDATION: Disable if empty or whitespace only
                        disabled={suggestionText.trim().length === 0}
                        onClick={async () => {
                            const trimmed = suggestionText.trim();
                            if (!trimmed) return;
                            try {
                                await submitSuggestion({
                                    gameId: game._id,
                                    playerId: playerId!,
                                    sessionToken,
                                    promptId: prompt._id,
                                    text: trimmed
                                });
                                setSuggestionText("");
                            } catch (e) {
                                showError("action-failed", (e as Error).message);
                            }
                        }}
                    >
                        Suggest
                    </Button>

                    {captainIsBot && (
                        <Button
                            id={`corner-submit-for-bot-${promptIdSafe}`}
                            data-testid={`corner-submit-for-bot-${promptIdSafe}`}
                            data-action="submit-answer-for-bot"
                            data-prompt-id={prompt._id}
                            data-attack-type={showAttackTypeSelector ? selectedAttackType : undefined}
                            variant="destructive"
                            className="whitespace-nowrap"
                            aria-label={`Submit answer for Bot for: ${prompt.text}`}
                            // VALIDATION: Disable if empty or whitespace only
                            disabled={suggestionText.trim().length === 0}
                            onClick={async () => {
                                const trimmed = suggestionText.trim();
                                if (!trimmed) return;
                                try {
                                    await submitAnswerForBot({
                                        gameId: game._id,
                                        playerId: playerId!, // Corner man's ID for auth
                                        sessionToken,
                                        promptId: prompt._id,
                                        text: trimmed,
                                        attackType: showAttackTypeSelector ? selectedAttackType : undefined
                                    });
                                    setIsSubmitted(true);
                                } catch (e) {
                                    showError("submit-failed", (e as Error).message);
                                }
                            }}
                        >
                            Submit as Answer
                        </Button>
                    )}
                </div>
                <div
                    id={`corner-suggestions-list-${promptIdSafe}`}
                    data-suggestion-count={mySuggestions.length}
                    className="mt-4 text-xs text-gray-400"
                >
                    My Suggestions:
                    <ul className="list-disc pl-4 mt-1">
                        {mySuggestions.map((s, i) => <li key={i}>{s.text}</li>)}
                    </ul>
                </div>
            </CardContent>
        </Card>
    );
}
