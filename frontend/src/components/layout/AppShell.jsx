import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#f6f7fb]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-h-screen flex-col lg:pl-72">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-[1500px]">
            <Outlet />
          </div>
        </main>
        <footer className="px-4 pb-6 text-center text-[11px] text-slate-400 sm:px-6 lg:px-8">
          BugTrack · MERN + Socket.IO · Built for agile teams
        </footer>
      </div>
    </div>
  );
}
