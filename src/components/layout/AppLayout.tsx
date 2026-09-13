import React, { useState, useEffect } from "react";
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 1024;
    }
    return true;
  });

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  return (
    <div id="app-root-layout" className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-900">
      {/* Sidebar (Always present, expanded or collapsed to icons) */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={onNavigate}
        isOpen={isSidebarOpen}
        onToggle={toggleSidebar}
      />

      {/* Main Content Column */}
      <div className="flex flex-col flex-1 h-screen overflow-hidden">
        {/* Top Header */}
        <Header
          currentPage={currentPage}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={toggleSidebar}
        />

        {/* Scrollable Main Viewport */}
        <main
          id="main-viewport"
          className="flex-1 overflow-y-auto p-4 sm:p-8 focus:outline-none"
        >
          {children}
        </main>
      </div>
    </div>
  );
};
