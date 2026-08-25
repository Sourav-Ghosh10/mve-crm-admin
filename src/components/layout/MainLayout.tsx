import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import Footer from "./Footer";

import SupportModal from "../common/Support/SupportModal";

const HEADER_HEIGHT = 64; // 4rem = 64px

const MainLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleSupportToggle = () => {
    setSupportOpen(!supportOpen);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Full width at top */}
      <Header 
        handleDrawerToggle={handleDrawerToggle} 
        onSupportClick={handleSupportToggle}
      />

      {/* Sidebar - Below header */}
      <Sidebar
        mobileOpen={mobileOpen}
        handleDrawerToggle={handleDrawerToggle}
        onSupportClick={handleSupportToggle}
      />

      {/* Main Content Area */}
      <main
        className="flex flex-col h-screen overflow-hidden"
        style={{
          paddingTop: HEADER_HEIGHT,
        }}
      >
        <div className="flex flex-1 overflow-hidden relative">
          {/* Sidebar remains fixed/absolute as defined in Sidebar component */}

          {/* Scrollable Content */}
          <div
            className="flex-1 flex flex-col overflow-y-auto custom-scrollbar md:ml-[260px]"
          >
            <div className="flex-1 p-4 md:p-8">
              <Outlet />
            </div>
            <Footer />
          </div>
        </div>
      </main>
      <SupportModal
        open={supportOpen}
        onClose={() => setSupportOpen(false)}
      />
    </div>
  );
};

export default MainLayout;
