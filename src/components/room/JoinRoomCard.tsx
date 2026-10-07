import React, { useState } from "react";
import { SignIn, ArrowRight, WarningCircle } from "@phosphor-icons/react";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { Input } from "@/components/common/Input";
import { Badge } from "@/components/common/Badge";

export interface JoinRoomCardProps {
  onJoinRoom?: (roomId: string) => void;
}

export const JoinRoomCard: React.FC<JoinRoomCardProps> = ({ onJoinRoom }) => {
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();

    if (!trimmed) {
      setError("Please enter a room token or invite link");
      return;
    }

    // Extract token if user pasted full URL (e.g., https://.../#room=abc123)
    let token = trimmed;
    if (trimmed.includes("#room=")) {
      token = trimmed.split("#room=")[1]?.split("&")[0] || trimmed;
    } else if (trimmed.includes("/")) {
      token = trimmed.split("/").pop() || trimmed;
    }

    if (token.length < 6) {
      setError("Token appears too short to be a valid room ID");
      return;
    }

    setError(null);
    if (onJoinRoom) {
      onJoinRoom(token);
    }
  };

  return (
    <Card className="flex flex-col justify-between border-slate-800 hover:border-slate-700 transition-colors">
      <form onSubmit={handleJoin} className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="w-12 h-12 rounded-xl bg-cyan-600/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <SignIn size={26} weight="duotone" />
          </div>
          <Badge variant="neutral">2-Person Max</Badge>
        </div>

        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Join Existing Room</h2>
          <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">
            Have an invite from someone? Paste the invite link or 16-character room code below.
          </p>
        </div>

        <div className="pt-1">
          <Input
            placeholder="Paste invite link or room token..."
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              if (error) setError(null);
            }}
            error={error || undefined}
            rightIcon={
              error ? (
                <WarningCircle size={18} className="text-red-400" weight="fill" />
              ) : null
            }
          />
        </div>
      </form>

      <div className="pt-6 mt-2">
        <Button
          variant="secondary"
          size="md"
          className="w-full"
          onClick={handleJoin}
          icon={<ArrowRight size={18} weight="bold" />}
          iconPosition="right"
        >
          Join Room
        </Button>
      </div>
    </Card>
  );
};
