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

  const sections = [
    {
      title: 'Academic Hub',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
        { id: 'upload', label: 'Upload Paper', icon: <UploadCloud className="h-5 w-5" /> },
      ]
    },
    {
      title: 'Library',
      items: [
        { 
          id: 'papers', 
          label: 'My Papers', 
          icon: <FolderOpen className="h-5 w-5" />, 
          badge: userProfile?.paperCount && userProfile.paperCount > 0 ? userProfile.paperCount : undefined 
        },
        { id: 'saved', label: 'Saved Papers', icon: <Bookmark className="h-5 w-5" /> },
      ]
    },
    {
      title: 'AI Copilot',
      items: [
        { id: 'history', label: 'AI History', icon: <History className="h-5 w-5" /> },
        { id: 'quiz', label: 'Comprehension Quiz', icon: <Award className="h-5 w-5" /> },
        { id: 'presentation', label: 'Presentation Outline', icon: <Presentation className="h-5 w-5" /> },
      ]
    },
    {
      title: 'Preferences',
      items: [
        { id: 'profile', label: 'My Profile', icon: <User className="h-5 w-5" /> },
        { id: 'settings', label: 'Settings', icon: <Settings className="h-5 w-5" /> },
      ]
    }
  ];

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between bg-white dark:bg-[#0f0f13] border-r border-slate-200 dark:border-slate-800 text-slate-750 dark:text-slate-300 font-sans transition-colors duration-350">
      <div className="flex flex-col flex-1 min-h-0">
        {/* Brand Logotype */}
        <div className="p-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="p-2 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-xl text-white shadow-md shadow-indigo-600/20 flex-shrink-0">
              <BookOpen className="h-5 w-5" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-slate-900 dark:text-white tracking-tight text-base whitespace-nowrap flex items-center">
                  Scholar<span className="text-indigo-600 dark:text-indigo-400">AI</span>
                  <span className="ml-2 text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold px-1.5 py-0.5 rounded border border-emerald-500/20 tracking-wider">
                    FREE
                  </span>
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 tracking-wider uppercase font-mono mt-0.5 leading-none">Academic Engine</span>
              </div>
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
        <nav className="p-4 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
          {sections.map((section, idx) => (
            <div key={section.title} className="space-y-1.5">
              {!collapsed ? (
                <div className="px-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase mb-2">
                  {section.title}
                </div>
              ) : (
                idx > 0 && <div className="h-px bg-slate-200 dark:bg-slate-850 my-4 mx-2" />
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setTab(item.id);
                        setMobileOpen(false); // Close mobile panel on click
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all group relative ${
                        isActive 
                          ? 'bg-gradient-to-r from-indigo-600/10 to-indigo-600/5 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25 dark:border-indigo-500/15 shadow-sm shadow-indigo-500/5' 
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-white text-slate-500 dark:text-slate-400 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center space-x-3.5 min-w-0">
                        {/* Active vertical line indicator */}
                        {isActive && (
                          <span className="absolute left-0 top-2.5 bottom-2.5 w-1 bg-indigo-600 dark:bg-indigo-400 rounded-r-md" />
                        )}
                        <span className={`flex-shrink-0 transition-all duration-300 ${
                          isActive 
                            ? 'text-indigo-600 dark:text-indigo-400 scale-105' 
                            : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white group-hover:scale-105'
                        }`}>
                          {item.icon}
                        </span>
                        {!collapsed && (
                          <span className="truncate transition-colors duration-200">{item.label}</span>
                        )}
                      </div>
                      
                      {/* Dynamic badge for count of items */}
                      {!collapsed && item.badge !== undefined && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/10">
                          {item.badge}
                        </span>
                      )}

                      {/* Tooltip for collapsed state */}
                      {collapsed && (
                        <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 dark:bg-slate-950 text-white text-xs font-semibold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-xl border border-slate-800 whitespace-nowrap z-50 pointer-events-none">
                          {item.label}
                          {item.badge !== undefined && (
                            <span className="ml-1.5 bg-indigo-500 px-1.5 py-0.2 rounded text-[9px]">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* User profile snippet */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-4 flex-shrink-0 bg-slate-50/50 dark:bg-[#0b0b0e] transition-colors duration-300">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3'} p-2.5 rounded-xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 shadow-sm`}>
          <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 text-white font-bold flex items-center justify-center shadow-inner flex-shrink-0 relative">
            {userProfile?.name ? userProfile.name[0].toUpperCase() : 'U'}
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-950" />
          </div>
          {!collapsed && (
            <div className="truncate flex-1">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate leading-snug">{userProfile?.name || 'Guest Scholar'}</h4>
              <p className="text-xs text-slate-400 truncate mt-0.5">{userProfile?.email || 'guest@paperexplainer.local'}</p>
              <div className="flex items-center space-x-2 mt-1.5">
                <span className="inline-flex items-center text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold px-2 py-0.5 rounded-full border border-indigo-500/10">
                  <Sparkles className="h-2.5 w-2.5 mr-1" />
                  {userProfile?.aiUsageCount || 0} Queries
                </span>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onLogout}
          className={`w-full flex items-center ${collapsed ? 'justify-center' : 'space-x-3'} px-4 py-2.5 rounded-xl text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/5 border border-transparent hover:border-rose-500/10 transition-all group relative`}
        >
          <LogOut className="h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover:-translate-x-0.5" />
          {!collapsed && <span className="truncate">Reset Workspace</span>}
          {collapsed && (
            <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-xl whitespace-nowrap z-50 pointer-events-none">
              Reset Workspace
            </div>
          )}
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
