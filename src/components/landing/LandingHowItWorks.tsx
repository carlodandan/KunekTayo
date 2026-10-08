import React from "react";
import { PlusCircleIcon, PaperPlaneTiltIcon, PhoneDisconnectIcon, ArrowRightIcon } from "@phosphor-icons/react";

export const LandingHowItWorks: React.FC = () => {
  const steps = [
    {
      step: "01",
      icon: <PlusCircleIcon size={24} weight="bold" className="text-[#9098C8]" />,
      title: "Create Instant Room",
      description:
        "Click one button to generate a 128-bit cryptographically unique room ID and token using standard Web Crypto. No email, username, or phone number required.",
    },
    {
      step: "02",
      icon: <PaperPlaneTiltIcon size={24} weight="bold" className="text-[#9098C8]" />,
      title: "Share Private Link",
      description:
        "Copy your single-use invite link or scan the deep-link QR code. Send it to the one person you want to talk with through any messaging channel.",
    },
    {
      step: "03",
      icon: <PhoneDisconnectIcon size={24} weight="bold" className="text-[#f0b232]" />,
      title: "Talk Privately & Dissolve",
      description:
        "Enjoy direct peer-to-peer audio, video, and self-purging text chat. When you hang up, everything dissolves. Zero logs, zero residue, zero traces.",
    },
  ];

  return (
    <section id="how-it-works" className="w-full py-12 sm:py-20 px-4 sm:px-6 bg-[#1e1f22]/40">
      <div className="max-w-5xl mx-auto space-y-8 sm:space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#9098C8]">
            Simplicity by Design
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#f2f3f5] tracking-tight">
            How KunekTayo Works
          </h2>
          <p className="text-xs sm:text-base text-[#949ba4] max-w-xl mx-auto">
            From zero to an encrypted conversation in less than five seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {steps.map((item, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-[#2b2d31] border border-[#35373c] flex flex-col justify-between space-y-4 relative"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-[#1e1f22] border border-[#35373c] flex items-center justify-center">
                    {item.icon}
                  </div>
                  <span className="font-mono text-2xl font-black text-[#35373c] select-none">
                    {item.step}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-[#f2f3f5]">{item.title}</h3>

                <p className="text-xs sm:text-sm text-[#949ba4] leading-relaxed">
                  {item.description}
                </p>
              </div>

              {idx < steps.length - 1 && (
                <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-[#35373c]">
                  <ArrowRightIcon size={20} weight="bold" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
