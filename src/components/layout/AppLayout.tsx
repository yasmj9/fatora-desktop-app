import React from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { NavPageId } from "../../types/navigation";

interface AppLayoutProps {
  currentPage: NavPageId;
  onNavigate: (page: NavPageId) => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentPage,
  onNavigate,
  children,
}) => {
  return (
    <div id="app-root-layout" className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-900">
      {/* Fixed Desktop Sidebar */}
      <Sidebar currentPage={currentPage} onNavigate={onNavigate} />

      {/* Main Content Column */}
      <div className="flex flex-col flex-1 h-screen overflow-hidden">
        {/* Top Header */}
        <Header currentPage={currentPage} />

        {/* Scrollable Main Viewport */}
        <main
          id="main-viewport"
          className="flex-1 overflow-y-auto p-8 focus:outline-none"
        >
          {children}
        </main>
      </div>
    </div>
  );
};
