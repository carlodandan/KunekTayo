import React, { useState } from "react";
import {
  Clock,
  Copy,
  Check,
  User,
  UserPlus,
  SignOut,
  Broadcast,
  ShareNetwork,
  UsersThree,
} from "@phosphor-icons/react";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { Badge } from "@/components/common/Badge";
import { useRoom } from "@/context/RoomContext";

export const WaitingRoomView: React.FC = () => {
  const {
    session,
    inviteUrl,
    timeRemaining,
    leaveRoom,
    simulateSecondParticipantJoin,
  } = useRoom();

  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Join my KunekTayo Room",
          text: "Connect with me privately on KunekTayo (1-on-1 voice, video & chat):",
          url: inviteUrl,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    handleCopyLink();
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col space-y-6 animate-in fade-in duration-200">
      {/* Status banner */}
      <Card className="border-amber-500/30 bg-amber-950/20 p-5 sm:p-6 text-left space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Broadcast size={22} weight="duotone" className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Waiting for 2nd Participant
              </h2>
              <p className="text-xs text-slate-400">
                1 of 2 participant slots filled
              </p>
            </div>
          </div>

          {/* 30-minute solo room countdown */}
          <div className="flex items-center gap-2 bg-slate-950/70 border border-amber-500/30 px-3.5 py-1.5 rounded-xl">
            <Clock size={16} className="text-amber-400 animate-spin" weight="bold" />
            <div className="flex flex-col text-right">
              <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">
                Solo Room TTL
              </span>
              <span className="font-mono text-sm sm:text-base font-bold text-amber-300">
                {timeRemaining?.formatted || "30:00"}
              </span>
            </div>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          This room will automatically expire if a second person doesn’t join within{" "}
          <strong className="text-amber-300">30 minutes</strong>. Once your guest joins,
          this timer cancels and the room remains alive indefinitely.
        </p>
      </Card>

      {/* Shareable Invite Card */}
      <Card elevated className="space-y-4 text-left p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShareNetwork size={20} className="text-blue-400" weight="bold" />
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
              Shareable Invite Link
            </h3>
          </div>
          <Badge variant="info">Room #{session?.roomId.substring(0, 8)}</Badge>
        </div>

        <p className="text-xs text-slate-400">
          Send this one-time link to the person you want to talk with. Only 1 person can join.
        </p>

        {/* Link display & copy input */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
          <div className="flex-1 min-w-0 bg-slate-950/90 border border-slate-800 rounded-xl px-3.5 py-3 text-xs sm:text-sm text-blue-300 font-mono truncate select-all">
            {inviteUrl || "Generating invite link..."}
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={handleCopyLink}
            icon={copied ? <Check size={18} className="text-emerald-300" weight="bold" /> : <Copy size={18} weight="bold" />}
            className="shrink-0"
          >
            {copied ? "Link Copied!" : "Copy Link"}
          </Button>
          {typeof navigator !== "undefined" && "share" in navigator && (
            <Button
              variant="secondary"
              size="md"
              onClick={handleShare}
              icon={<ShareNetwork size={18} weight="bold" />}
              className="shrink-0 hidden sm:inline-flex"
            >
              Share
            </Button>
          )}
        </div>
      </Card>

      {/* Participant Slots (Strict 2-Person Limit) */}
      <div className="space-y-2 text-left">
        <div className="flex items-center justify-between px-1 text-xs text-slate-400">
          <span>Room Slots (Max 2 Participants)</span>
          <span className="text-blue-400 font-semibold">1 / 2 Occupied</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Host Slot */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <User size={20} weight="bold" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">You (Host)</p>
                <p className="text-xs text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  Connected
                </p>
              </div>
            </div>
            <Badge variant="success">Slot 1</Badge>
          </div>

          {/* Guest Slot */}
          <div className="p-4 rounded-xl bg-slate-950/40 border border-dashed border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-800/40 border border-slate-700/40 flex items-center justify-center text-slate-500">
                <UserPlus size={20} weight="bold" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-400">Awaiting Guest</p>
                <p className="text-xs text-slate-500">Empty slot</p>
              </div>
            </div>
            <Badge variant="neutral">Slot 2</Badge>
          </div>
        </div>
      </div>

      {/* Actions and Testing Controls */}
      <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="md"
          onClick={leaveRoom}
          icon={<SignOut size={18} />}
          className="text-red-400 hover:text-red-300 hover:bg-red-950/30"
        >
          Leave Room
        </Button>

        {/* Interactive test trigger to demonstrate transition to Active state */}
        <Button
          variant="outline"
          size="md"
          onClick={simulateSecondParticipantJoin}
          icon={<UsersThree size={18} className="text-cyan-400" />}
          className="border-cyan-800/60 text-cyan-300 hover:bg-cyan-950/40"
        >
          Simulate Guest Join (Test 2/2 Active)
        </Button>
      </div>
    </div>
  );
};
