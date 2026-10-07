import React from "react";
import {
  ShieldCheck,
  User,
  SignOut,
  Infinity as InfinityIcon,
  UserMinus,
  Sparkle,
} from "@phosphor-icons/react";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { Badge } from "@/components/common/Badge";
import { useRoom } from "@/context/RoomContext";

export const ActiveRoomView: React.FC = () => {
  const {
    session,
    leaveRoom,
    simulateSecondParticipantLeave,
  } = useRoom();

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col space-y-6 animate-in fade-in duration-200">
      {/* Active state banner */}
      <Card className="border-emerald-500/30 bg-emerald-950/20 p-5 sm:p-6 text-left space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck size={24} weight="duotone" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Room Active — 2 of 2 Connected
              </h2>
              <p className="text-xs text-emerald-300">
                Authoritative 2-Person Limit Enforced
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/70 border border-emerald-500/30 px-3.5 py-1.5 rounded-xl">
            <InfinityIcon size={18} className="text-emerald-400" weight="bold" />
            <div className="flex flex-col text-right">
              <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">
                Room Lifespan
              </span>
              <span className="font-mono text-xs sm:text-sm font-bold text-emerald-300">
                Active Indefinitely
              </span>
            </div>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          The second participant joined! The 30-minute solo expiration timer is{" "}
          <strong className="text-emerald-300">cancelled</strong>. This room will stay
          connected for as long as both participants remain present.
        </p>
      </Card>

      {/* Connected Participant Slots */}
      <div className="space-y-2 text-left">
        <div className="flex items-center justify-between px-1 text-xs text-slate-400">
          <span>Active Participants (Room #{session?.roomId.substring(0, 8)})</span>
          <span className="text-emerald-400 font-semibold">Capacity Reached (2/2)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Host */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-blue-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <User size={20} weight="bold" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  {session?.myRole === "host" ? "You (Host)" : "Host"}
                </p>
                <p className="text-xs text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                  Active
                </p>
              </div>
            </div>
            <Badge variant="info">Host</Badge>
          </div>

          {/* Guest */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-emerald-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <User size={20} weight="bold" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  {session?.myRole === "guest" ? "You (Guest)" : "Guest"}
                </p>
                <p className="text-xs text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                  Active
                </p>
              </div>
            </div>
            <Badge variant="success">Guest</Badge>
          </div>
        </div>
      </div>

      {/* Phase 3 & 4 Call Pipeline Readiness */}
      <Card elevated className="p-5 text-left space-y-3 bg-slate-950/60 border-slate-800">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
          <Sparkle size={16} className="text-blue-400" />
          <span>Next Pipeline Stages</span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Both participants are verified by the room state actor. In <strong>Phase 3 & 4</strong>,
          peer signaling connects audio and video streams via WebRTC P2P.
        </p>
      </Card>

      {/* Actions and Testing Controls */}
      <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <Button
          variant="danger"
          size="md"
          onClick={leaveRoom}
          icon={<SignOut size={18} />}
        >
          Leave Room
        </Button>

        {/* Interactive test trigger to demonstrate transition when 1 participant leaves */}
        <Button
          variant="outline"
          size="md"
          onClick={simulateSecondParticipantLeave}
          icon={<UserMinus size={18} className="text-amber-400" />}
          className="border-amber-800/60 text-amber-300 hover:bg-amber-950/40"
        >
          Simulate Guest Leaving (Test 30m Countdown Restart)
        </Button>
      </div>
    </div>
  );
};
