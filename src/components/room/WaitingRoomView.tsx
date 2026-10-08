import React, { useState } from "react";
import {
  ClockIcon,
  CheckIcon,
  CopyIcon,
  UserIcon,
  UserPlusIcon,
  SignOutIcon,
  BroadcastIcon,
  ShareNetworkIcon,
  UsersThreeIcon,
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
      <Card className="border-[#35373c] bg-[#2b2d31] p-5 sm:p-6 text-left space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1e1f22] border border-[#35373c] flex items-center justify-center text-[#f0b232]">
              <BroadcastIcon size={22} weight="duotone" className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#f2f3f5] tracking-tight">
                Waiting for 2nd Participant
              </h2>
              <p className="text-xs text-[#949ba4]">
                1 of 2 participant slots filled
              </p>
            </div>
          </div>

          {/* 30-minute solo room countdown */}
          <div className="flex items-center gap-2 bg-[#1e1f22] border border-[#35373c] px-3.5 py-1.5 rounded-xl">
            <ClockIcon size={16} className="text-[#f0b232] animate-spin" weight="bold" />
            <div className="flex flex-col text-right">
              <span className="text-[10px] text-[#949ba4] uppercase font-semibold tracking-wider">
                Solo Room TTL
              </span>
              <span className="font-mono text-sm sm:text-base font-bold text-[#f0b232]">
                {timeRemaining?.formatted || "30:00"}
              </span>
            </div>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-[#dbdee1] leading-relaxed">
          This room will automatically expire if a second person doesn’t join within{" "}
          <strong className="text-[#f0b232]">30 minutes</strong>. Once your guest joins,
          this timer cancels and the room remains alive indefinitely.
        </p>
      </Card>

      {/* Shareable Invite Card */}
      <Card elevated className="space-y-4 text-left p-5 sm:p-6 bg-[#2b2d31] border-[#35373c]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShareNetworkIcon size={20} className="text-[#9098C8]" weight="bold" />
            <h3 className="text-sm font-semibold text-[#dbdee1] uppercase tracking-wider">
              Shareable Invite Link
            </h3>
          </div>
          <Badge variant="info">Room #{session?.roomId.substring(0, 8)}</Badge>
        </div>

        <p className="text-xs text-[#949ba4]">
          Send this one-time link to the person you want to talk with. Only 1 person can join.
        </p>

        {/* Link display & copy input */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
          <div className="flex-1 min-w-0 bg-[#1e1f22] border border-[#35373c] rounded-xl px-3.5 py-3 text-xs sm:text-sm text-[#dbdee1] font-mono truncate select-all">
            {inviteUrl || "Generating invite link..."}
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={handleCopyLink}
            icon={copied ? <CheckIcon size={18} className="text-[#9098C8]" weight="bold" /> : <CopyIcon size={18} weight="bold" />}
            className="shrink-0"
          >
            {copied ? "Link Copied!" : "Copy Link"}
          </Button>
          {typeof navigator !== "undefined" && "share" in navigator && (
            <Button
              variant="secondary"
              size="md"
              onClick={handleShare}
              icon={<ShareNetworkIcon size={18} weight="bold" />}
              className="shrink-0 inline-flex"
            >
              Share Link
            </Button>
          )}
        </div>
      </Card>

      {/* Participant Slots (Strict 2-Person Limit) */}
      <div className="space-y-2 text-left">
        <div className="flex items-center justify-between px-1 text-xs text-[#949ba4]">
          <span>Room Slots (Max 2 Participants)</span>
          <span className="text-[#9098C8] font-semibold">1 / 2 Occupied</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Host Slot */}
          <div className="p-4 rounded-xl bg-[#2b2d31] border border-[#35373c] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1e1f22] border border-[#35373c] flex items-center justify-center text-[#9098C8]">
                <UserIcon size={20} weight="bold" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#f2f3f5]">You (Host)</p>
                <p className="text-xs text-[#9098C8] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#9098C8] inline-block" />
                  Ready
                </p>
              </div>
            </div>
            <Badge variant="info">Slot 1</Badge>
          </div>

          {/* Guest Slot */}
          <div className="p-4 rounded-xl bg-[#1e1f22] border border-dashed border-[#35373c] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#2b2d31] border border-[#35373c] flex items-center justify-center text-[#80848e]">
                <UserPlusIcon size={20} weight="bold" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#949ba4]">Awaiting Guest</p>
                <p className="text-xs text-[#80848e]">Empty slot</p>
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
          icon={<SignOutIcon size={18} />}
          className="text-red-400 hover:text-red-300 hover:bg-red-950/30"
        >
          Leave Room
        </Button>

        {/* Interactive test trigger to demonstrate transition to Active state */}
        <Button
          variant="outline"
          size="md"
          onClick={simulateSecondParticipantJoin}
          icon={<UsersThreeIcon size={18} className="text-cyan-400" />}
          className="border-cyan-800/60 text-cyan-300 hover:bg-cyan-950/40"
        >
          Simulate Guest Join (Test 2/2 Active)
        </Button>
      </div>
    </div>
  );
};
