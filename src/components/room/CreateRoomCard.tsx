import React from "react";
import { PlusCircle, Link, ShieldCheck } from "@phosphor-icons/react";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { Badge } from "@/components/common/Badge";
import { useRoom } from "@/context/RoomContext";

export const CreateRoomCard: React.FC = () => {
  const { createRoom, isLoading } = useRoom();

  const handleCreate = async () => {
    await createRoom();
  };

  return (
    <Card className="flex flex-col justify-between border-[#35373c] bg-[#2b2d31] hover:border-[#4e5058] transition-colors text-left p-5 sm:p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="w-12 h-12 rounded-xl bg-[#1e1f22] border border-[#35373c] flex items-center justify-center text-[#5865f2]">
            <PlusCircle size={26} weight="duotone" />
          </div>
          <Badge variant="success">
            <ShieldCheck size={13} weight="fill" />
            Durable Objects
          </Badge>
        </div>

        <div>
          <h2 className="text-xl font-bold text-[#f2f3f5] tracking-tight">Create a Room</h2>
          <p className="text-sm text-[#949ba4] mt-1.5 leading-relaxed">
            Generate an ephemeral room with a cryptographically secure token.
            Strict 2-person limit with a 30-minute solo room countdown.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-[#1e1f22] border border-[#35373c] text-xs space-y-1.5 text-[#949ba4]">
          <div className="flex items-center justify-between">
            <span>Authoritative State:</span>
            <span className="text-[#dbdee1] font-medium">Cloudflare Durable Object</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Solo Expiration:</span>
            <span className="text-[#f0b232] font-medium">30 minutes</span>
          </div>
        </div>
      </div>

      <div className="pt-6 mt-2">
        <Button
          variant="primary"
          size="md"
          className="w-full"
          onClick={handleCreate}
          isLoading={isLoading}
          icon={<Link size={18} weight="bold" />}
        >
          Create Private Room
        </Button>
      </div>
    </Card>
  );
};
