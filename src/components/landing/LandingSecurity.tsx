import React from "react";
import { Check, X, ShieldCheck, LockKey, HardDrives } from "@phosphor-icons/react";

export const LandingSecurity: React.FC = () => {
  const comparison = [
    {
      feature: "User Registration & Accounts",
      traditional: "Mandatory (Email, Phone, Passwords)",
      kunektayo: "Zero Accounts (Cryptographic Tokens Only)",
      isPositive: true,
    },
    {
      feature: "Participant Capacity",
      traditional: "Unlimited / Massive servers & groups",
      kunektayo: "Strictly 2 Maximum (Hard Enforced)",
      isPositive: true,
    },
    {
      feature: "Audio & Video Media Routing",
      traditional: "Central SFU servers & cloud relays",
      kunektayo: "Direct P2P (DTLS-SRTP End-to-End)",
      isPositive: true,
    },
    {
      feature: "Chat Message Retention",
      traditional: "Stored permanently in cloud databases",
      kunektayo: "In-Memory Only with Burning TTL Auto-Purge",
      isPositive: true,
    },
    {
      feature: "Room Lifespan",
      traditional: "Permanent channels & link persistence",
      kunektayo: "30-Min Solo Auto-Destruction via Cloudflare Alarm",
      isPositive: true,
    },
    {
      feature: "Data Profiling & Tracking",
      traditional: "Telemetric user tracking & metadata profiling",
      kunektayo: "Zero Tracking, Zero Cookies, Zero Analytics",
      isPositive: true,
    },
  ];

  return (
    <section id="security" className="w-full py-12 sm:py-20 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-8 sm:space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#5865f2]">
            Security & Privacy
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#f2f3f5] tracking-tight">
            How KunekTayo compares to conventional apps
          </h2>
          <p className="text-xs sm:text-base text-[#949ba4] max-w-xl mx-auto">
            We removed the accounts, the databases, and the central servers to give you complete
            peace of mind.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="w-full rounded-2xl bg-[#2b2d31] border border-[#35373c] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-[#35373c] bg-[#1e1f22]/70">
                  <th className="p-4 sm:p-5 font-bold text-[#dbdee1]">Architecture Feature</th>
                  <th className="p-4 sm:p-5 font-semibold text-[#949ba4]">Traditional Services</th>
                  <th className="p-4 sm:p-5 font-bold text-[#5865f2]">KunekTayo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#35373c]">
                {comparison.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#35373c]/30 transition-colors">
                    <td className="p-4 sm:p-5 font-medium text-[#f2f3f5]">{row.feature}</td>
                    <td className="p-4 sm:p-5 text-[#949ba4]">
                      <div className="flex items-center gap-2">
                        <X size={15} className="text-[#da373c] shrink-0" weight="bold" />
                        <span>{row.traditional}</span>
                      </div>
                    </td>
                    <td className="p-4 sm:p-5 font-semibold text-[#f2f3f5]">
                      <div className="flex items-center gap-2">
                        <Check size={16} className="text-[#23a55a] shrink-0" weight="bold" />
                        <span>{row.kunektayo}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cryptographic Primitives Highlight Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 pt-4">
          <div className="p-5 rounded-xl bg-[#2b2d31] border border-[#35373c] space-y-2">
            <div className="flex items-center gap-2 text-[#5865f2]">
              <LockKey size={18} weight="bold" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#dbdee1]">
                128-Bit Token Entropy
              </h4>
            </div>
            <p className="text-xs text-[#949ba4] leading-relaxed">
              Tokens are generated using cryptographically secure pseudo-random values. Plaintext
              tokens never touch the signaling server; only SHA-256 hashes are verified.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#2b2d31] border border-[#35373c] space-y-2">
            <div className="flex items-center gap-2 text-[#23a55a]">
              <ShieldCheck size={18} weight="bold" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#dbdee1]">
                Constant-Time Verification
              </h4>
            </div>
            <p className="text-xs text-[#949ba4] leading-relaxed">
              Hash checks use constant-time comparison (<code className="text-[#5865f2]">timingSafeEqual</code>)
              to neutralize side-channel timing attacks attempting to deduce token digests.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#2b2d31] border border-[#35373c] space-y-2">
            <div className="flex items-center gap-2 text-[#f0b232]">
              <HardDrives size={18} weight="bold" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#dbdee1]">
                Zero Disk Persistence
              </h4>
            </div>
            <p className="text-xs text-[#949ba4] leading-relaxed">
              Cloudflare Durable Objects coordinate the room in volatile memory. When participants
              leave, <code className="text-[#5865f2]">storage.deleteAll()</code> wipes every record instantly.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
