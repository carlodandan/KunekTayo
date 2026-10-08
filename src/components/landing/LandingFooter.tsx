import React from "react";
import { GithubLogoIcon, ShieldCheckIcon } from "@phosphor-icons/react";
import { APP_NAME } from "@/constants/app";

export const LandingFooter: React.FC = () => {
  return (
    <footer className="w-full border-t border-[#35373c] bg-[#1e1f22] px-4 py-12 sm:px-6 select-none">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt={APP_NAME}
                className="w-8 h-8 rounded-xl object-contain bg-[#2b2d31] p-1 border border-[#35373c] shrink-0"
              />
              <span className="text-lg font-bold text-[#f2f3f5]">{APP_NAME}</span>
            </div>
            <p className="text-xs text-[#949ba4] max-w-sm leading-relaxed">
              Lightweight, temporary 1-to-1 communication desktop, mobile, and web app.
              Connect directly. Talk privately. Leave with zero trace.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#9098C8]">
              <ShieldCheckIcon size={16} weight="fill" />
              <span>Zero server database • Zero user tracking</span>
            </div>
          </div>

          {/* Navigation Col */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#dbdee1]">
              Navigation
            </h4>
            <ul className="space-y-2 text-xs text-[#949ba4]">
              <li>
                <a href="#features" className="hover:text-[#f2f3f5] transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-[#f2f3f5] transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#security" className="hover:text-[#f2f3f5] transition-colors">
                  Security & Privacy
                </a>
              </li>
              <li>
                <a href="#downloads" className="hover:text-[#f2f3f5] transition-colors">
                  Downloads
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-[#f2f3f5] transition-colors">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Source & Legal Col */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#dbdee1]">
              Open Source
            </h4>
            <ul className="space-y-2 text-xs text-[#949ba4]">
              <li>
                <a
                  href="https://github.com/carlodandan/KunekTayo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-[#f2f3f5] transition-colors"
                >
                  <GithubLogoIcon size={14} weight="bold" />
                  <span>GitHub Repository</span>
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/carlodandan/KunekTayo/releases"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#f2f3f5] transition-colors"
                >
                  Release Notes
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/carlodandan/KunekTayo/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#f2f3f5] transition-colors"
                >
                  Report Issue
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-[#35373c] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#80848e]">
          <div>
            &copy; {new Date().getFullYear()} {APP_NAME}. Released under MIT License.
          </div>
          <div className="flex items-center gap-1">
            <span>Designed for private 1-to-1 connections</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
