import { Button } from "@/components/ui/button";
import { Id } from "../../../convex/_generated/dataModel";
import { GameState } from "@/lib/types";
import { useErrorState } from "@/hooks/useErrorState";
import { ErrorBanner } from "@/components/ui/error-banner";

interface LobbyViewProps {
    game: GameState;
    playerId: Id<"players"> | null;
    isVip: boolean;
    startGame: (args: { gameId: Id<"games"> }) => Promise<any>;
}

export function LobbyView({ game, playerId, isVip, startGame }: LobbyViewProps) {
    const { error, showError, clearError } = useErrorState();

    return (
        <div
            id="lobby-view"
            data-game-phase="lobby"
            data-player-count={game.players.length}
            data-can-start={game.players.length >= 1}
            data-is-vip={isVip}
            className="space-y-4"
        >
            <ErrorBanner error={error} onDismiss={clearError} />

            <h3 id="lobby-title" className="font-bold">Waiting for players...</h3>
            <ul
                id="lobby-player-list"
                data-testid="lobby-player-list"
                data-count={game.players.length}
                className="space-y-1 bg-white p-4 rounded border"
            >
                {game.players.map((p) => (
                    <li
                        key={p._id}
                        id={`player-item-${p.name.replace(/\s+/g, '-').toLowerCase()}`}
                        data-player-id={p._id}
                        data-is-vip={p.isVip}
                        data-is-me={p._id === playerId}
                        data-is-bot={p.isBot}
                        className="flex justify-between"
                    >
                        <span>{p.name} {p._id === playerId && "(You)"}</span>
                        {p.isVip && <span aria-label="VIP Player">👑</span>}
                    </li>
                ))}
            </ul>
            {isVip && (
                <>
                    {game.players.length < 1 && <div id="min-players-warning" className="text-destructive font-bold mb-2 text-center text-sm">Need at least 1 player</div>}
                    <Button
                        id="start-game-button"
                        data-testid="start-game-button"
                        data-action="start-game"
                        data-requires-vip="true"
                        data-player-count={game.players.length}
                        data-can-start={game.players.length >= 1}
                        aria-label="Start the game (requires at least 1 player)"
                        className="w-full"
                        size="lg"
                        disabled={game.players.length < 1}
                        onClick={() => startGame({ gameId: game._id }).catch((e: any) => showError("action-failed", e.message))}
                    >
                        Start Game
                    </Button>
                </>
            )}
        </div>
    );
}
