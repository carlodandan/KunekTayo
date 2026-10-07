import React from "react";
import { Header } from "./Header";
import { StatusBar } from "./StatusBar";

export interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100 selection:bg-blue-600/30 selection:text-white pt-safe pb-safe pl-safe pr-safe">
      <Header />
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-center items-center">
        {children}
      </main>
      <StatusBar />
    </div>
  );
};
