import React from "react";
import { HourglassLow, PlusCircle, House } from "@phosphor-icons/react";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { useRoom } from "@/context/RoomContext";

export const ExpiredRoomView: React.FC = () => {
  const { createRoom, leaveRoom } = useRoom();

  return (
    <div className="w-full max-w-md mx-auto flex flex-col space-y-6 animate-in fade-in duration-200">
      <Card elevated className="border-red-500/30 bg-red-950/20 p-6 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mx-auto">
          <HourglassLow size={28} weight="duotone" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-white tracking-tight">
            Room Expired
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
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
            className="w-full text-slate-400 hover:text-white"
          >
            Back to Home
          </Button>
        </div>
      </Card>
    </div>
  );
};
