import React from "react";
import {
  WindowsLogo,
  AndroidLogo,
  Globe,
  DownloadSimple,
  ArrowRight,
  CheckCircle,
} from "@phosphor-icons/react";

interface LandingDownloadsProps {
  onLaunchApp: () => void;
}

export const LandingDownloads: React.FC<LandingDownloadsProps> = ({ onLaunchApp }) => {
  return (
    <section id="downloads" className="w-full py-12 sm:py-20 px-4 sm:px-6 bg-[#1e1f22]/50">
      <div className="max-w-5xl mx-auto space-y-8 sm:space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#9098C8]">
            Multi-Platform
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#f2f3f5] tracking-tight">
            Use KunekTayo on any device
          </h2>
          <p className="text-xs sm:text-base text-[#949ba4] max-w-xl mx-auto">
            Install native binaries for peak performance, or run directly in your web browser with
            zero setup.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Windows Desktop */}
          <div className="p-6 rounded-2xl bg-[#2b2d31] border border-[#35373c] flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#1e1f22] border border-[#35373c] flex items-center justify-center text-[#9098C8]">
                <WindowsLogo size={28} weight="fill" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-[#f2f3f5]">Windows Desktop</h3>
                <span className="text-xs text-[#949ba4]">Windows 10 / 11 (64-bit)</span>
              </div>

              <ul className="space-y-2 text-xs text-[#dbdee1]">
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-[#9098C8] shrink-0" weight="fill" />
                  <span>Native NSIS Setup Installer & Portable .exe</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-[#9098C8] shrink-0" weight="fill" />
                  <span>Low latency WebRTC hardware acceleration</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-[#9098C8] shrink-0" weight="fill" />
                  <span>High-fidelity microphone device routing</span>
                </li>
              </ul>
            </div>

            <a
              href="https://github.com/carlodandan/KunekTayo/releases/latest"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#283E7C] hover:bg-[#283E7C]/85 active:scale-[0.98] text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer min-h-[48px]"
            >
              <DownloadSimple size={18} weight="bold" />
              <span>Download for Windows</span>
            </a>
          </div>

          {/* Android Mobile */}
          <div className="p-6 rounded-2xl bg-[#2b2d31] border border-[#35373c] flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#1e1f22] border border-[#35373c] flex items-center justify-center text-[#9098C8]">
                <AndroidLogo size={28} weight="fill" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-[#f2f3f5]">Android Mobile</h3>
                <span className="text-xs text-[#949ba4]">Android 8.0+ (Oreo to Android 15)</span>
              </div>

              <ul className="space-y-2 text-xs text-[#dbdee1]">
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-[#9098C8] shrink-0" weight="fill" />
                  <span>Signed standalone APK package</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-[#9098C8] shrink-0" weight="fill" />
                  <span>Touch-optimized mobile UI (&ge;48dp targets)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-[#9098C8] shrink-0" weight="fill" />
                  <span>Front/rear camera selection & deep linking</span>
                </li>
              </ul>
            </div>

            <a
              href="https://github.com/carlodandan/KunekTayo/releases/latest"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#2b2d31] hover:bg-[#35373c] active:scale-[0.98] border border-[#35373c] text-[#f2f3f5] text-xs sm:text-sm font-semibold transition-all cursor-pointer min-h-[48px]"
            >
              <DownloadSimple size={18} weight="bold" />
              <span>Download Android APK</span>
            </a>
          </div>

          {/* Web Browser */}
          <div className="p-6 rounded-2xl bg-[#2b2d31] border border-[#35373c] flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#1e1f22] border border-[#35373c] flex items-center justify-center text-[#f0b232]">
                <Globe size={28} weight="bold" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-[#f2f3f5]">Instant Web App</h3>
                <span className="text-xs text-[#949ba4]">Chrome, Edge, Firefox, Safari</span>
              </div>

              <ul className="space-y-2 text-xs text-[#dbdee1]">
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-[#9098C8] shrink-0" weight="fill" />
                  <span>No installation required — pure web standards</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-[#9098C8] shrink-0" weight="fill" />
                  <span>Instant URL-based invite link acceptance</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-[#9098C8] shrink-0" weight="fill" />
                  <span>High-performance, zero-logging ephemeral network</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={onLaunchApp}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#35373c] hover:bg-[#404249] active:scale-[0.98] text-[#f2f3f5] text-xs sm:text-sm font-semibold transition-all cursor-pointer min-h-[48px]"
            >
              <span>Launch Web Client</span>
              <ArrowRight size={16} weight="bold" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
