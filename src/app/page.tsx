"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ErrorBanner } from "@/components/ui/error-banner";
import { useErrorState } from "@/hooks/useErrorState";

export default function Home() {
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { error, showError, clearError } = useErrorState();
  const createGame = useMutation(api.lobby.create);
  const joinGame = useMutation(api.lobby.join);
  const router = useRouter();

  const handleCreate = async () => {
    if (!name) {
      showError("validation", "Please enter your name");
      return;
    }
    if (isLoading) return;
    setIsLoading(true);
    clearError();
    try {
      const { roomCode } = await createGame({});
      const { playerId } = await joinGame({ roomCode, playerName: name });
      sessionStorage.setItem("playerId", playerId);
      sessionStorage.setItem("playerName", name);
      router.push(`/room?code=${roomCode}`);
    } catch (e: any) {
      console.error(e);
      showError("create-failed", e.message || "Failed to create game");
      setIsLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!name || !roomCode) {
      showError("validation", "Please enter name and room code");
      return;
    }
    if (isLoading) return;
    setIsLoading(true);
    clearError();
    try {
      const code = roomCode.toUpperCase();
      const { playerId } = await joinGame({ roomCode: code, playerName: name });
      sessionStorage.setItem("playerId", playerId);
      sessionStorage.setItem("playerName", name);
      router.push(`/room?code=${code}`);
    } catch (e: any) {
      showError("join-failed", e.message || "Failed to join game");
      setIsLoading(false);
    }
  };

  return (
    <div
      id="home-page"
      data-page="home"
      data-is-loading={isLoading}
      data-has-error={!!error}
      className="flex items-center justify-center min-h-screen bg-gray-100 p-4"
    >
      <ErrorBanner error={error} onDismiss={clearError} />

      <Card id="home-card" className="w-full max-w-md">
        <CardHeader>
          <CardTitle id="app-title" className="text-center text-3xl font-bold">SmackTalk</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="player-name-input" className="text-sm font-medium">Your Name</label>
            <Input
              id="player-name-input"
              data-testid="player-name-input"
              data-required="true"
              aria-label="Enter your name to join or create a game"
              aria-required="true"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Button
                id="create-game-button"
                data-testid="create-game-button"
                data-action="create-game"
                data-has-name={name.length > 0}
                aria-label="Create a new game room"
                onClick={handleCreate}
                className="w-full"
                variant="default"
                disabled={isLoading}
              >
                {isLoading ? "Creating..." : "Create Game"}
              </Button>
            </div>

            <div className="space-y-2 flex flex-col">
              <Input
                id="room-code-input"
                data-testid="room-code-input"
                data-format="4-char-uppercase"
                aria-label="Enter 4-character room code to join existing game"
                placeholder="Room Code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                className="text-center uppercase"
                maxLength={4}
              />
              <Button
                id="join-game-button"
                data-testid="join-game-button"
                data-action="join-game"
                data-has-name={name.length > 0}
                data-has-code={roomCode.length === 4}
                aria-label="Join an existing game room"
                onClick={handleJoin}
                className="w-full"
                variant="outline"
                disabled={isLoading}
              >
                {isLoading ? "Joining..." : "Join Game"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

