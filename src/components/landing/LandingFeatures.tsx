import React from "react";
import {
  Users,
  Clock,
  LockKey,
  Fire,
  Paperclip,
  ShieldCheck,
} from "@phosphor-icons/react";

export const LandingFeatures: React.FC = () => {
  const features = [
    {
      icon: <Users size={24} weight="bold" className="text-[#9098C8]" />,
      title: "Strict 1-to-1 Boundary",
      description:
        "Every room is capped at exactly 2 participants (Host and Guest). Any third party attempting to enter is immediately rejected by authoritative server state.",
      badge: "No Groups",
    },
    {
      icon: <Clock size={24} weight="bold" className="text-[#f0b232]" />,
      title: "30-Minute Solo Room Expiration",
      description:
        "When you create a room, an automatic 30-minute countdown starts. If your peer doesn't connect within 30 minutes, the room self-destructs.",
      badge: "Auto-Purge",
    },
    {
      icon: <LockKey size={24} weight="bold" className="text-[#9098C8]" />,
      title: "Direct Peer-to-Peer Media",
      description:
        "High-definition video and voice travel directly device-to-device through WebRTC DTLS-SRTP encryption, bypassing central media servers entirely.",
      badge: "End-to-End Encrypted",
    },
    {
      icon: <Fire size={24} weight="fill" className="text-[#f0b232]" />,
      title: "Vanishing Ephemeral Chat",
      description:
        "In-band RTCDataChannel text chat with configurable TTL (15s to 5m). Messages exist solely in volatile browser RAM and auto-expire with a burning timer.",
      badge: "In-Memory Only",
    },
    {
      icon: <Paperclip size={24} weight="bold" className="text-[#9098C8]" />,
      title: "Ephemeral P2P File Sharing",
      description:
        "Transfer documents and photos directly over encrypted peer channels. Files are chunked in memory and auto-revoked upon room termination. No cloud uploads.",
      badge: "Zero Cloud Storage",
    },
    {
      icon: <ShieldCheck size={24} weight="bold" className="text-[#9098C8]" />,
      title: "Zero Accounts & Zero Database",
      description:
        "No signup forms, passwords, email verification, or tracking cookies. Room tokens are generated via 128-bit Web Crypto and leave no permanent record.",
      badge: "Zero Footprint",
    },
  ];

  return (
    <section id="features" className="w-full py-12 sm:py-20 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-8 sm:space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#9098C8]">
            Core Architecture
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#f2f3f5] tracking-tight">
            Built strictly for private conversations
          </h2>
          <p className="text-xs sm:text-base text-[#949ba4] max-w-xl mx-auto">
            Traditional chat apps store your conversations forever. KunekTayo is engineered from
            the ground up to dissolve the moment your call ends.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="p-5 sm:p-6 rounded-2xl bg-[#2b2d31] border border-[#35373c] hover:border-[#283E7C]/60 transition-colors flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-[#1e1f22] border border-[#35373c] flex items-center justify-center">
                    {feature.icon}
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-[#1e1f22] border border-[#35373c] text-[#949ba4]">
                    {feature.badge}
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-[#f2f3f5]">
                  {feature.title}
                </h3>

                <p className="text-xs sm:text-sm text-[#949ba4] leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
