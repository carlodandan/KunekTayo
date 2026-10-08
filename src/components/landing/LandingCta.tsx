import React from "react";
import { PlusCircleIcon, DownloadSimpleIcon } from "@phosphor-icons/react";

interface LandingCtaProps {
  onCreateRoom: () => void;
}

export const LandingCta: React.FC<LandingCtaProps> = ({ onCreateRoom }) => {
  return (
    <section className="w-full py-12 sm:py-20 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto rounded-3xl bg-[#2b2d31] border border-[#35373c] p-8 sm:p-14 text-center space-y-6">
        <h2 className="text-2xl sm:text-4xl font-extrabold text-[#f2f3f5] tracking-tight">
          Ready for a truly private conversation?
        </h2>

        <p className="text-xs sm:text-base text-[#949ba4] max-w-lg mx-auto leading-relaxed">
          Create an instant room in one click. No accounts, no phone numbers, and no software
          installation required to get started on the web.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 max-w-sm mx-auto">
          <button
            type="button"
            onClick={onCreateRoom}
            className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#283E7C] hover:bg-[#283E7C]/85 active:scale-[0.98] text-white text-sm sm:text-base font-semibold transition-all cursor-pointer min-h-[48px]"
          >
            <PlusCircleIcon size={20} weight="bold" />
            <span>Create Instant Room</span>
          </button>

          <a
            href="#downloads"
            className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#1e1f22] hover:bg-[#35373c] active:scale-[0.98] border border-[#35373c] text-[#f2f3f5] text-sm sm:text-base font-semibold transition-all cursor-pointer min-h-[48px]"
          >
            <DownloadSimpleIcon size={20} weight="bold" />
            <span>Download Apps</span>
          </a>
        </div>
      </div>
    </section>
  );
};
