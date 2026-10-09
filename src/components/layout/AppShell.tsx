import React from "react";
import { Header } from "./Header";
import { StatusBar } from "./StatusBar";

export interface AppShellProps {
  children: React.ReactNode;
  activeView?: "landing" | "app";
  onToggleView?: (view: "landing" | "app") => void;
  showViewToggle?: boolean;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  activeView,
  onToggleView,
  showViewToggle,
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#1e1f22] text-[#dbdee1] selection:bg-[#283E7C]/40 selection:text-white pt-safe pb-safe pl-safe pr-safe">
      <Header
        activeView={activeView}
        onToggleView={onToggleView}
        showViewToggle={showViewToggle}
      />
      <main className="flex-1 max-w-5xl w-full mx-auto p-2 sm:p-6 lg:p-8 flex flex-col justify-start sm:justify-center items-center">
        {children}
      </main>
      <StatusBar />
    </div>
  );
};
