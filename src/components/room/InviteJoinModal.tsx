import React, { useEffect, useState } from "react";
import { Link, SignIn, X, ShieldCheck } from "@phosphor-icons/react";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { Badge } from "@/components/common/Badge";
import { deepLinkService, DeepLinkPayload } from "@/services/deepLinkService";
import { useRoom } from "@/context/RoomContext";

export const InviteJoinModal: React.FC = () => {
  const { joinRoom, status, isLoading } = useRoom();
  const [pendingInvite, setPendingInvite] = useState<DeepLinkPayload | null>(null);

  useEffect(() => {
    // Check initial URL parameters
    const initial = deepLinkService.checkInitialUrl();
    if (initial && status === "idle") {
      setPendingInvite(initial);
    }

    // Listen for incoming deep link / hash events
    const unsubscribe = deepLinkService.onDeepLink((payload) => {
      if (status === "idle") {
        setPendingInvite(payload);
      }
    });

    return unsubscribe;
  }, [status]);

  if (!pendingInvite || status !== "idle") {
    return null;
  }

  const handleJoin = async () => {
    if (!pendingInvite) return;
    const { roomId, token } = pendingInvite;
    setPendingInvite(null);
    await joinRoom(roomId, token);
  };

  const handleDismiss = () => {
    setPendingInvite(null);
    if (typeof window !== "undefined" && window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <Card elevated className="w-full max-w-md bg-slate-900 border-slate-700 p-6 text-left space-y-5 relative">
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Link size={24} weight="bold" />
          </div>
          <div>
            <Badge variant="info">Direct Invite Detected</Badge>
            <h3 className="text-lg font-bold text-white mt-1">Join Private Room</h3>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Target Room:</span>
            <span className="font-mono text-blue-300 font-semibold">
              #{pendingInvite.roomId.substring(0, 8)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck size={14} weight="fill" />
            <span>Cryptographic invite token verified</span>
          </div>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          You are connecting as the 2nd participant. As soon as you join, the room becomes
          active indefinitely and WebRTC P2P negotiation begins.
        </p>

        <div className="flex flex-col sm:flex-row items-stretch gap-2.5 pt-2">
          <Button
            variant="primary"
            size="md"
            onClick={handleJoin}
            isLoading={isLoading}
            icon={<SignIn size={18} weight="bold" />}
            className="flex-1"
          >
            Join Room Now
          </Button>
          <Button
            variant="ghost"
            size="md"
            onClick={handleDismiss}
            className="text-slate-400 hover:text-white"
          >
            Dismiss
          </Button>
        </div>
      </Card>
    </div>
  );
};
