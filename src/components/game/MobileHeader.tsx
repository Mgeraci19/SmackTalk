/* eslint-disable @next/next/no-img-element */
import { GameState } from "@/lib/types";
import { Id } from "../../../convex/_generated/dataModel";

interface MobileHeaderProps {
    game: GameState;
    playerId: Id<"players"> | null;
}

export function MobileHeader({ game, playerId }: MobileHeaderProps) {
    const myPlayer = game.players.find(p => p._id === playerId);
    if (!myPlayer) return null;

    const myHp = myPlayer.hp ?? 100;
    const isLowHp = myHp <= 30;

    // Cornerman logic: find captain
    const captainId = myPlayer.teamId;
    const captain = captainId ? game.players.find(p => p._id === captainId) : null;
    const captainHp = captain?.hp ?? 100;

    return (
        <div className="sticky top-0 z-50 bg-white border-b shadow-sm p-3 flex items-center justify-between mb-4">
            {/* Left: Player Info */}
            <div className="flex items-center gap-3">
                {myPlayer.avatar ? (
                    <img
                        src={myPlayer.avatar}
                        alt="Me"
                        className="w-10 h-10 rounded-full border-2 border-gray-200 object-cover"
                    />
                ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">
                        {myPlayer.name.charAt(0)}
                    </div>
                )}
                <div className="leading-tight">
                    <div className="font-bold text-sm truncate max-w-[100px]">{myPlayer.name}</div>
                    <div className={`text-xs font-bold ${isLowHp ? "text-red-600 animate-pulse" : "text-green-600"}`}>
                        {myHp} HP
                    </div>
                </div>
            </div>

            {/* Right: Captain Info (if Cornerman) */}
            {captain && (
                <div className="flex items-center gap-2 text-right border-l pl-3 ml-2 border-gray-200">
                    <div className="leading-tight">
                        <div className="text-[10px] text-gray-500 uppercase tracking-tighter">Captain</div>
                        <div className="font-bold text-sm truncate max-w-[80px]">{captain.name}</div>
                        <div className={`text-xs font-bold ${captainHp <= 30 ? "text-red-600" : "text-blue-600"}`}>
                            {captainHp} HP
                        </div>
                    </div>
                    {captain.avatar ? (
                        <img
                            src={captain.avatar}
                            alt="Capt"
                            className="w-8 h-8 rounded border border-blue-200 object-cover opacity-75"
                        />
                    ) : (
                        <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center text-blue-500 text-xs font-bold">
                            C
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
