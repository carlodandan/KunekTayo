import React from "react";
import { LandingNav } from "./LandingNav";
import { LandingHero } from "./LandingHero";
import { LandingPreview } from "./LandingPreview";
import { LandingFeatures } from "./LandingFeatures";
import { LandingHowItWorks } from "./LandingHowItWorks";
import { LandingSecurity } from "./LandingSecurity";
import { LandingDownloads } from "./LandingDownloads";
import { LandingFaq } from "./LandingFaq";
import { LandingCta } from "./LandingCta";
import { LandingFooter } from "./LandingFooter";

interface LandingPageProps {
  onLaunchApp: () => void;
  onCreateRoom: () => void;
  onJoinRoom: () => void;
  activeView?: "landing" | "app";
  onToggleView?: (view: "landing" | "app") => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onLaunchApp,
  onCreateRoom,
  onJoinRoom,
  activeView = "landing",
  onToggleView,
}) => {
  return (
    <div className="min-h-screen w-full flex flex-col bg-[#1e1f22] text-[#dbdee1] selection:bg-[#5865f2]/40 selection:text-white">
      {/* Top Navigation */}
      <LandingNav
        onLaunchApp={onLaunchApp}
        onCreateRoom={onCreateRoom}
        activeView={activeView}
        onToggleView={onToggleView}
      />

      {/* Main Content */}
      <main className="flex-1 w-full">
        {/* Hero Section */}
        <LandingHero onCreateRoom={onCreateRoom} onJoinRoom={onJoinRoom} />

        {/* Live Interface Mockup Preview */}
        <LandingPreview />

        {/* The 6 Core Pillars */}
        <LandingFeatures />

        {/* 3-Step Walkthrough */}
        <LandingHowItWorks />

        {/* Security & Traditional Apps Comparison */}
        <LandingSecurity />

        {/* Multi-Platform Downloads */}
        <LandingDownloads onLaunchApp={onLaunchApp} />

        {/* FAQ Accordion */}
        <LandingFaq />

        {/* Pre-Footer Call to Action */}
        <LandingCta onCreateRoom={onCreateRoom} />
      </main>

      {/* Footer */}
      <LandingFooter />
    </div>
  );
};
