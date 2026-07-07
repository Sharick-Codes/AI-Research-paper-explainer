import React from 'react';
import { 
  BookOpen, 
  LayoutDashboard, 
  UploadCloud, 
  FolderOpen, 
  History, 
  Bookmark, 
  Award, 
  Presentation, 
  User, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { UserProfile } from '../types';

interface SidebarProps {
  currentTab: string;
  setTab: (tab: string) => void;
  userProfile: UserProfile | null;
  onLogout: () => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export default function Sidebar({
  currentTab,
  setTab,
  userProfile,
  onLogout,
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen
}: SidebarProps) {

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { id: 'upload', label: 'Upload Paper', icon: <UploadCloud className="h-5 w-5" /> },
    { id: 'papers', label: 'My Papers', icon: <FolderOpen className="h-5 w-5" /> },
    { id: 'saved', label: 'Saved Papers', icon: <Bookmark className="h-5 w-5" /> },
    { id: 'history', label: 'AI History', icon: <History className="h-5 w-5" /> },
    { id: 'quiz', label: 'Comprehension Quiz', icon: <Award className="h-5 w-5" /> },
    { id: 'presentation', label: 'Presentation outline', icon: <Presentation className="h-5 w-5" /> },
    { id: 'profile', label: 'My Profile', icon: <User className="h-5 w-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="h-5 w-5" /> },
  ];

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between bg-white dark:bg-[#0f0f13] border-r border-slate-200 dark:border-slate-800 text-slate-750 dark:text-slate-300 font-sans transition-colors duration-350">
      {/* Brand Logotype */}
      <div>
        <div className="p-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-md shadow-indigo-600/10 flex-shrink-0">
              <BookOpen className="h-5 w-5" />
            </div>
            {!collapsed && (
              <span className="font-bold text-slate-900 dark:text-white tracking-tight text-base whitespace-nowrap">
                Scholar<span className="text-indigo-600 dark:text-indigo-400">AI</span>
              </span>
            )}
          </div>
          
          {/* Collapse toggle (Desktop only) */}
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation list */}
        <nav className="p-4 space-y-1.5 flex-1">
          {menuItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setTab(item.id);
                  setMobileOpen(false); // Close mobile panel on click
                }}
                className={`w-full flex items-center space-x-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all group ${
                  isActive 
                    ? 'bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 dark:border-indigo-500/10' 
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white text-slate-500 dark:text-slate-400'
                }`}
              >
                <span className={`flex-shrink-0 transition-colors ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white'}`}>
                  {item.icon}
                </span>
                {!collapsed && (
                  <span className="truncate">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User profile snippet */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3'} p-2 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80`}>
          <div className="h-10 w-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shadow-inner flex-shrink-0">
            {userProfile?.name ? userProfile.name[0].toUpperCase() : 'U'}
          </div>
          {!collapsed && (
            <div className="truncate flex-1">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate leading-snug">{userProfile?.name || 'User'}</h4>
              <p className="text-xs text-slate-500 truncate mt-0.5">{userProfile?.email || 'user@example.com'}</p>
            </div>
          )}
        </div>

        <button
          onClick={onLogout}
          className={`w-full flex items-center ${collapsed ? 'justify-center' : 'space-x-3'} px-4 py-3 rounded-xl text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/5 border border-transparent hover:border-rose-500/10 transition-all`}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span>Log Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop static sidebar */}
      <aside className={`hidden md:block h-screen flex-shrink-0 transition-all duration-300 select-none ${collapsed ? 'w-20' : 'w-64'}`}>
        {sidebarContent}
      </aside>

      {/* Mobile drawer overlay background */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          className="md:hidden fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40"
        />
      )}

      {/* Mobile drawer panel */}
      <aside className={`md:hidden fixed inset-y-0 left-0 w-64 z-50 transform transition-transform duration-300 ease-in-out ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {sidebarContent}
      </aside>
    </>
  );
}
