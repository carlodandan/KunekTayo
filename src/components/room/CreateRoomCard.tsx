import React, { useState } from "react";
import { PlusCircle, Link, Copy, Check, ShieldCheck } from "@phosphor-icons/react";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { Badge } from "@/components/common/Badge";

export interface CreateRoomCardProps {
  onCreateRoom?: (generatedRoomId: string) => void;
}

export const CreateRoomCard: React.FC<CreateRoomCardProps> = ({
  onCreateRoom,
}) => {
  const [createdRoomId, setCreatedRoomId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = () => {
    // Generate a secure temporary room token for demo/scaffold
    const randomBytes = new Uint8Array(8);
    crypto.getRandomValues(randomBytes);
    const token = Array.from(randomBytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    
    setCreatedRoomId(token);
    if (onCreateRoom) {
      onCreateRoom(token);
    }
  };

  const handleCopy = () => {
    if (!createdRoomId) return;
    const url = `${window.location.origin}/#room=${createdRoomId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="flex flex-col justify-between border-slate-800 hover:border-slate-700 transition-colors">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <PlusCircle size={26} weight="duotone" />
          </div>
          <Badge variant="neutral">Phase 1 Ready</Badge>
        </div>

        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Create a Room</h2>
          <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">
            Generate an ephemeral room. You’ll get a unique invite link to share with exactly one person.
          </p>
        </div>

        {createdRoomId && (
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-400" />
                Temporary Room Token
              </span>
              <span className="text-amber-400 font-mono">30m solo TTL</span>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 font-mono text-xs text-blue-300 bg-slate-900 px-2.5 py-1.5 rounded-lg truncate border border-slate-800">
                {createdRoomId}
              </code>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopy}
                icon={copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              >
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="pt-6 mt-2">
        <Button
          variant="primary"
          size="md"
          className="w-full"
          onClick={handleCreate}
          icon={<Link size={18} weight="bold" />}
        >
          {createdRoomId ? "Generate New Token" : "Create Private Room"}
        </Button>
      </div>
    </Card>
  );
};
