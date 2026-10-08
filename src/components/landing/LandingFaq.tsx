import React, { useState } from "react";
import { CaretDown, CaretUp, Question } from "@phosphor-icons/react";

interface FaqItem {
  question: string;
  answer: string;
}

export const LandingFaq: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FaqItem[] = [
    {
      question: "Do I need to sign up or create an account?",
      answer:
        "No. KunekTayo has zero user accounts, zero logins, and zero identity profiling. Every session is authenticated purely through 128-bit cryptographically secure pseudorandom tokens generated on demand in your browser.",
    },
    {
      question: "Why is there a 30-minute expiration countdown?",
      answer:
        "When you create a room and wait for your peer, an authoritative Cloudflare Durable Object alarm runs for 30 minutes. If no one joins, the room self-destructs to prevent orphaned instances. Once your peer connects, the timer cancels and the room remains alive indefinitely until you finish talking.",
    },
    {
      question: "Can a third person eavesdrop or join our room?",
      answer:
        "No. KunekTayo strictly enforces a 2-participant ceiling at the authoritative server level. If a third person clicks your invite link, they receive an immediate HTTP 409 (ROOM_FULL) rejection. In addition, media is encrypted end-to-end via WebRTC DTLS-SRTP directly between your two devices.",
    },
    {
      question: "Where are our chat messages and shared files stored?",
      answer:
        "Nowhere on any server or database. Ephemeral chat and files travel exclusively over direct WebRTC RTCDataChannels between peers. Messages feature a burning TTL auto-expiration timer (15s–5m) that purges them from RAM. Files are held in temporary memory blobs and revoked when the session ends.",
    },
    {
      question: "What happens when we hang up or leave the room?",
      answer:
        "When both participants disconnect, the Cloudflare Durable Object calls storage.deleteAll() to obliterate the room state from memory. No call history, transcripts, recordings, or user records are ever retained.",
    },
    {
      question: "Can I use KunekTayo on both desktop and mobile?",
      answer:
        "Yes. KunekTayo is available as a native Windows application (.exe / .msi), a native Android application (.apk), and directly in modern web browsers (Chrome, Edge, Firefox, Safari) with zero installation required.",
    },
  ];

  const toggle = (idx: number) => {
    setOpenIndex((prev) => (prev === idx ? null : idx));
  };

  return (
    <section id="faq" className="w-full py-12 sm:py-20 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-8 sm:space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#5865f2]">
            Questions & Answers
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#f2f3f5] tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-base text-[#949ba4] max-w-xl mx-auto">
            Everything you need to know about KunekTayo's ephemeral architecture.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-xl bg-[#2b2d31] border border-[#35373c] overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left font-bold text-sm sm:text-base text-[#f2f3f5] hover:text-[#5865f2] transition-colors cursor-pointer select-none"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center gap-3">
                    <Question size={18} className="text-[#5865f2] shrink-0" weight="bold" />
                    <span>{faq.question}</span>
                  </div>
                  <span className="text-[#949ba4] shrink-0">
                    {isOpen ? <CaretUp size={16} weight="bold" /> : <CaretDown size={16} weight="bold" />}
                  </span>
                </button>

                {isOpen && (
                  <div className="px-4 pb-5 sm:px-5 sm:pb-6 text-xs sm:text-sm text-[#949ba4] leading-relaxed border-t border-[#35373c]/50 pt-3">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
