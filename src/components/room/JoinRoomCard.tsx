import React, { useState } from "react";
import { SignIn, ArrowRight, WarningCircle } from "@phosphor-icons/react";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { Input } from "@/components/common/Input";
import { Badge } from "@/components/common/Badge";
import { useRoom } from "@/context/RoomContext";
import { parseInviteInput } from "@/utils/crypto";

export const JoinRoomCard: React.FC = () => {
  const { joinRoom, isLoading, error: roomError } = useRoom();
  const [inputValue, setInputValue] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInviteInput(inputValue);

    if (!parsed) {
      setLocalError("Please enter a valid room token or invite link");
      return;
    }

    setLocalError(null);
    await joinRoom(parsed.roomId, parsed.token);
  };

  const displayError = localError || (roomError ? roomError.message : null);

  return (
    <Card className="flex flex-col justify-between border-[#35373c] bg-[#2b2d31] hover:border-[#4e5058] transition-colors text-left p-5 sm:p-6">
      <form onSubmit={handleJoin} className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="w-12 h-12 rounded-xl bg-[#1e1f22] border border-[#35373c] flex items-center justify-center text-[#5865f2]">
            <SignIn size={26} weight="duotone" />
          </div>
          <Badge variant="neutral">2-Person Max</Badge>
        </div>

        <div>
          <h2 className="text-xl font-bold text-[#f2f3f5] tracking-tight">Join Existing Room</h2>
          <p className="text-sm text-[#949ba4] mt-1.5 leading-relaxed">
            Have an invite from someone? Paste the invite link or 16-character room code below.
          </p>
        </div>

        <div className="pt-1">
          <Input
            placeholder="Paste invite link or room token..."
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              if (localError) setLocalError(null);
            }}
            error={displayError || undefined}
            rightIcon={
              displayError ? (
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
          isLoading={isLoading}
          icon={<ArrowRight size={18} weight="bold" />}
          iconPosition="right"
        >
          Join Room
        </Button>
      </div>
    </Card>
  );
};
