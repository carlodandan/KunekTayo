import React from "react";
import { HourglassLow, PlusCircle, House } from "@phosphor-icons/react";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { useRoom } from "@/context/RoomContext";

export const ExpiredRoomView: React.FC = () => {
  const { createRoom, leaveRoom } = useRoom();

  return (
    <div className="w-full max-w-md mx-auto flex flex-col space-y-6 animate-in fade-in duration-200">
      <Card elevated className="border-[#35373c] bg-[#2b2d31] p-6 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-[#1e1f22] border border-[#35373c] flex items-center justify-center text-[#da373c] mx-auto">
          <HourglassLow size={28} weight="duotone" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-[#f2f3f5] tracking-tight">
            Room Expired
          </h2>
          <p className="text-xs sm:text-sm text-[#dbdee1] leading-relaxed">
            This private room was automatically closed after 30 minutes with only 1 participant.
            Expired rooms are permanently purged to protect privacy.
          </p>
        </div>

        <div className="pt-4 flex flex-col gap-2.5">
          <Button
            variant="primary"
            size="md"
            onClick={createRoom}
            icon={<PlusCircle size={18} weight="bold" />}
            className="w-full"
          >
            Create a New Room
          </Button>

          <Button
            variant="ghost"
            size="md"
            onClick={leaveRoom}
            icon={<House size={18} />}
            className="w-full text-[#949ba4] hover:text-[#f2f3f5]"
          >
            Back to Home
          </Button>
        </div>
      </Card>
    </div>
  );
};
