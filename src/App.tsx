import React, { useState, useEffect } from 'react';
import { 
  auth, 
  db, 
  signOut 
} from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs, updateDoc } from 'firebase/firestore';
import { 
  BookOpen, 
  Sparkles, 
  FileText, 
  Bookmark, 
  Award, 
  Presentation, 
  User as UserIcon, 
  Settings as SettingsIcon,
  Moon,
  Sun,
  Menu,
  Sparkle,
  Plus,
  ArrowRight,
  TrendingUp,
  Inbox,
  AlertCircle,
  HelpCircle,
  Save,
  Trash2,
  Lock,
  LogOut,
  Bell,
  Globe,
  Languages,
  CheckCircle2
} from 'lucide-react';

// Custom subcomponents
import LandingPage from './components/LandingPage';
import AuthPages from './components/AuthPages';
import Sidebar from './components/Sidebar';
import DashboardMain from './components/DashboardMain';
import PaperDetails from './components/PaperDetails';
import AIChatBot from './components/AIChatBot';

import { Paper, UserProfile } from './types';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [papers, setPapers] = useState<Paper[]>([]);
  
  // App navigation state
  const [view, setView] = useState<'landing' | 'auth_login' | 'auth_register' | 'workspace'>('workspace');
  const [currentTab, setTab] = useState<string>('dashboard');
  const [activePaper, setActivePaper] = useState<Paper | null>(null);
  
  // Theme & sidebar layout settings
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  
  // Loading status
  const [loadingAuth, setLoadingAuth] = useState<boolean>(true);
  const [loadingData, setLoadingData] = useState<boolean>(false);

  // Sync dark mode class on HTML document element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Initialize free/guest user session immediately
  useEffect(() => {
    const initSession = async () => {
      const user = auth.currentUser;
      setCurrentUser(user);
      setLoadingAuth(false);
      setView('workspace');
      if (user) {
        await fetchUserData(user);
      }
    };
    initSession();
  }, []);

  const fetchUserData = async (user: User) => {
    setLoadingData(true);
    try {
      // 1. Fetch user profile from Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      let profile: UserProfile;

      if (!userDocSnap.exists()) {
        // Create a default profile on first login
        profile = {
          userId: user.uid,
          name: user.displayName || user.email?.split('@')[0] || 'Scholar',
          email: user.email || '',
          photoURL: user.photoURL || '',
          paperCount: 0,
          aiUsageCount: 0,
          theme: 'light',
          language: 'English',
          notificationsEnabled: true,
          createdAt: new Date().toISOString()
        };
        await setDoc(userDocRef, profile);
      } else {
        profile = userDocSnap.data() as UserProfile;
      }
      
      setUserProfile(profile);
      setDarkMode(profile.theme === 'dark');

      // 2. Fetch user's papers collection
      const papersCollectionRef = collection(db, 'users', user.uid, 'papers');
      const papersSnapshot = await getDocs(papersCollectionRef);
      
      const loadedPapers: Paper[] = [];
      papersSnapshot.forEach((doc) => {
        loadedPapers.push(doc.data() as Paper);
      });
      
      setPapers(loadedPapers);
      
      // If there is an active paper selected, keep its context synced
      if (activePaper) {
        const synced = loadedPapers.find(p => p.id === activePaper.id);
        if (synced) setActivePaper(synced);
      }

    } catch (err) {
      console.error("Error fetching user data:", err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleRefreshPapers = async () => {
    if (!currentUser) return;
    try {
      const papersCollectionRef = collection(db, 'users', currentUser.uid, 'papers');
      const papersSnapshot = await getDocs(papersCollectionRef);
      const loadedPapers: Paper[] = [];
      papersSnapshot.forEach((doc) => {
        loadedPapers.push(doc.data() as Paper);
      });
      setPapers(loadedPapers);
      
      if (activePaper) {
        const synced = loadedPapers.find(p => p.id === activePaper.id);
        if (synced) {
          setActivePaper(synced);
        }
      }
    } catch (err) {
      console.error("Failed to refresh papers:", err);
    }
  };

  const handleUpdateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!currentUser || !userProfile) return;
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const updatedProfile = { ...userProfile, ...updates };
      await updateDoc(userDocRef, updates);
      setUserProfile(updatedProfile);
      if (updates.theme !== undefined) {
        setDarkMode(updates.theme === 'dark');
      }
    } catch (err) {
      console.error("Failed to update user profile:", err);
    }
  };

  const handleLogout = () => {
    if (confirm("Resetting your workspace will delete all your guest progress, uploaded research papers, and AI chat history. Are you sure you want to proceed and start a fresh free session?")) {
      localStorage.removeItem('guest_user_id');
      window.location.reload();
    }
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex flex-col items-center justify-center space-y-4">
        <LoaderSpinner />
        <span className="text-sm font-semibold text-slate-400">Loading PaperExplainer workspace...</span>
      </div>
    );
  }

  // LOGGED OUT VIEWS
  if (view === 'landing') {
    return (
      <LandingPage 
        onGetStarted={() => setView('auth_register')} 
        onLogin={() => setView('auth_login')} 
      />
    );
  }

  if (view === 'auth_login' || view === 'auth_register') {
    return (
      <AuthPages 
        initialView={view === 'auth_login' ? 'login' : 'register'}
        onSuccess={() => setView('workspace')}
        onBackToHome={() => setView('landing')}
      />
    );
  }

  // RENDERING INTERNAL TABS
  const renderTabContent = () => {
    if (activePaper) {
      return (
        <PaperDetails 
          paper={activePaper}
          onBack={() => setActivePaper(null)}
          onRefreshPapers={handleRefreshPapers}
        />
      );
    }

    switch (currentTab) {
      case 'dashboard':
        return (
          <DashboardMain 
            papers={papers}
            userProfile={userProfile}
            onPaperSelected={(p) => setActivePaper(p)}
            onRefreshPapers={handleRefreshPapers}
            onUpdateUserProfile={handleUpdateUserProfile}
          />
        );

      case 'upload':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Upload New Research</h1>
              <p className="text-slate-500 text-sm">Add any PDF document to begin multi-angle AI analysis.</p>
            </div>
            <DashboardMain 
              papers={papers}
              userProfile={userProfile}
              onPaperSelected={(p) => setActivePaper(p)}
              onRefreshPapers={handleRefreshPapers}
              onUpdateUserProfile={handleUpdateUserProfile}
            />
          </div>
        );

      case 'papers':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">My Research Papers</h1>
              <p className="text-slate-500 text-sm">Explore and analyze papers in your library.</p>
            </div>
            <DashboardMain 
              papers={papers}
              userProfile={userProfile}
              onPaperSelected={(p) => setActivePaper(p)}
              onRefreshPapers={handleRefreshPapers}
              onUpdateUserProfile={handleUpdateUserProfile}
            />
          </div>
        );

      case 'saved':
        const saved = papers.filter(p => p.isSaved);
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Saved Papers</h1>
              <p className="text-slate-500 text-sm">Bookmarks & quick-access research articles.</p>
            </div>
            <DashboardMain 
              papers={saved}
              userProfile={userProfile}
              onPaperSelected={(p) => setActivePaper(p)}
              onRefreshPapers={handleRefreshPapers}
              onUpdateUserProfile={handleUpdateUserProfile}
            />
          </div>
        );

      case 'history':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">AI Explanation History</h1>
              <p className="text-slate-500 text-sm">Track your previous analysis requests and generated contents.</p>
            </div>
            
            <div className="bg-white dark:bg-[#0f0f13] border border-slate-200/80 dark:border-slate-800 p-6 rounded-2xl space-y-4">
              {papers.length === 0 ? (
                <div className="text-center py-10 text-slate-450">No research papers in history. Upload a PDF first!</div>
              ) : (
                <div className="space-y-4">
                  {papers.map(p => (
                    <div 
                      key={p.id}
                      onClick={() => setActivePaper(p)}
                      className="p-5 border border-slate-100 dark:border-slate-800 hover:border-indigo-500/20 dark:hover:border-indigo-500/30 hover:bg-slate-50 dark:hover:bg-slate-900/40 rounded-2xl flex items-center justify-between cursor-pointer transition-all"
                    >
                      <div className="space-y-1">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">{p.title}</h4>
                        <div className="flex items-center space-x-2 text-xs text-slate-400">
                          <span className="font-semibold text-indigo-600 dark:text-indigo-400">Analyzed</span>
                          <span>•</span>
                          <span>Uploaded {new Date(p.uploadDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <button className="p-2 bg-indigo-600 hover:bg-indigo-550 text-white rounded-xl transition-colors cursor-pointer">
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'quiz':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Comprehension Quizzes</h1>
              <p className="text-slate-500 text-sm">Test your learning progress with custom-crafted AI questions.</p>
            </div>

            <div className="bg-white dark:bg-[#0f0f13] border border-slate-200/80 dark:border-slate-800 p-6 rounded-2xl space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white">Active Paper Quizzes</h3>
              <p className="text-sm text-slate-405 leading-relaxed">Select any of your papers below to access the Interactive Quiz tab instantly.</p>
              
              {papers.length === 0 ? (
                <div className="text-center py-8 text-slate-450 text-sm">No uploaded papers found. Upload a paper first to unlock quizzes!</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {papers.map(p => (
                    <div 
                      key={p.id}
                      onClick={() => {
                        setActivePaper(p);
                        setTab('dashboard'); // detail page auto overrides tab selection
                      }}
                      className="p-5 bg-slate-50 dark:bg-[#0a0a0c]/85 hover:bg-indigo-500/[0.02] border border-slate-100 dark:border-slate-800 rounded-2xl cursor-pointer hover:border-indigo-500/20 transition-all space-y-3"
                    >
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">{p.title}</h4>
                      <p className="text-xs text-slate-450">Word count: {p.wordCount || 'N/A'}</p>
                      <span className="inline-flex items-center space-x-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                        <span>Access quiz</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'presentation':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Presentation Outlines</h1>
              <p className="text-slate-500 text-sm">Instantly prepare slide outline guides for defenses or seminars.</p>
            </div>

            <div className="bg-white dark:bg-[#0f0f13] border border-slate-200/80 dark:border-slate-800 p-6 rounded-2xl space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white">Active Presentation Outlines</h3>
              <p className="text-sm text-slate-450">Select any paper below to view the PPT Deck Outline generated specifically for your research material.</p>
              
              {papers.length === 0 ? (
                <div className="text-center py-8 text-slate-450 text-sm">No uploaded papers found. Upload a paper first to generate slides!</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {papers.map(p => (
                    <div 
                      key={p.id}
                      onClick={() => {
                        setActivePaper(p);
                        setTab('dashboard');
                      }}
                      className="p-5 bg-slate-50 dark:bg-[#0a0a0c]/85 hover:bg-indigo-500/[0.02] border border-slate-100 dark:border-slate-800 rounded-2xl cursor-pointer hover:border-indigo-500/20 transition-all space-y-3"
                    >
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">{p.title}</h4>
                      <p className="text-xs text-slate-450">Word count: {p.wordCount || 'N/A'}</p>
                      <span className="inline-flex items-center space-x-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                        <span>Generate slide outline</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'profile':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">My Profile</h1>
              <p className="text-slate-500 text-sm">Manage your academic credentials and workspace statistics.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Profile Card */}
              <div className="md:col-span-1 bg-white dark:bg-[#0f0f13] border border-slate-200/80 dark:border-slate-800 p-6 rounded-2xl text-center space-y-4 shadow-sm">
                <div className="h-20 w-20 rounded-full bg-indigo-600 text-white font-bold text-3xl flex items-center justify-center shadow-inner mx-auto">
                  {userProfile?.name ? userProfile.name[0].toUpperCase() : 'U'}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">{userProfile?.name}</h3>
                  <p className="text-xs text-slate-405 mt-1">{userProfile?.email}</p>
                </div>
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-center gap-3">
                  <span className="text-[10px] font-bold text-slate-450 uppercase bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-full">Academic Scholar</span>
                </div>
              </div>

              {/* Statistics Bento Card */}
              <div className="md:col-span-2 bg-white dark:bg-[#0f0f13] border border-slate-200/80 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-6">
                <h3 className="font-bold text-slate-900 dark:text-white">Workspace Statistics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-[#0a0a0c]/85 rounded-xl space-y-1.5">
                    <span className="text-xs text-slate-400 font-semibold">Papers Uploaded</span>
                    <h4 className="text-2xl font-extrabold text-slate-900 dark:text-white">{userProfile?.paperCount || 0}</h4>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-[#0a0a0c]/85 rounded-xl space-y-1.5">
                    <span className="text-xs text-slate-400 font-semibold">AI Explanations Triggered</span>
                    <h4 className="text-2xl font-extrabold text-slate-900 dark:text-white">{userProfile?.aiUsageCount || 0}</h4>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-xs text-slate-500">Profile synchronized with Firestore database on {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Settings</h1>
              <p className="text-slate-500 text-sm">Personalize language, visual layouts, and notification feeds.</p>
            </div>

            <div className="bg-white dark:bg-[#0f0f13] border border-slate-200/80 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800/60 shadow-sm max-w-2xl">
              {/* Theme Settings */}
              <div className="p-6 flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Visual Theme</h4>
                  <p className="text-xs text-slate-400">Toggle dark mode comfort layouts designed for late-night research sessions.</p>
                </div>
                <button
                  onClick={() => handleUpdateUserProfile({ theme: darkMode ? 'light' : 'dark' })}
                  className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl transition-all cursor-pointer text-slate-700 dark:text-slate-300"
                >
                  {darkMode ? <Sun className="h-5 w-5 text-amber-500 animate-pulse" /> : <Moon className="h-5 w-5" />}
                </button>
              </div>

              {/* Language Preferences */}
              <div className="p-6 flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Language Selection</h4>
                  <p className="text-xs text-slate-400">Change UI system defaults and explanation output structures.</p>
                </div>
                <div className="relative">
                  <select
                    value={userProfile?.language || 'English'}
                    onChange={(e) => handleUpdateUserProfile({ language: e.target.value })}
                    className="px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 cursor-pointer focus:ring-1 focus:ring-indigo-500/50"
                  >
                    <option value="English">English (US)</option>
                    <option value="Spanish">Spanish (ES)</option>
                    <option value="French">French (FR)</option>
                    <option value="German">German (DE)</option>
                    <option value="Mandarin">Mandarin (ZH)</option>
                  </select>
                </div>
              </div>

              {/* Notification Settings */}
              <div className="p-6 flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">System Notifications</h4>
                  <p className="text-xs text-slate-400">Receive alerts when long analytical papers complete parsing feeds.</p>
                </div>
                <button
                  onClick={() => handleUpdateUserProfile({ notificationsEnabled: !userProfile?.notificationsEnabled })}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    userProfile?.notificationsEnabled 
                      ? 'bg-indigo-950/40 text-indigo-400 border border-indigo-500/10' 
                      : 'bg-slate-900 text-slate-550 border border-slate-800'
                  }`}
                >
                  {userProfile?.notificationsEnabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
      }
  };

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-[#0a0a0c] text-slate-800 dark:text-slate-200 flex transition-colors duration-300 ${darkMode ? 'dark' : ''}`}>
      
      {/* SIDEBAR */}
      <Sidebar 
        currentTab={currentTab}
        setTab={setTab}
        userProfile={userProfile}
        onLogout={handleLogout}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />

      {/* WORKSPACE FRAME */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* TOP BAR BAR */}
        <header className="sticky top-0 z-20 backdrop-blur bg-white/85 dark:bg-[#0f0f13]/85 border-b border-slate-200 dark:border-[#1b1b22] h-16 flex items-center justify-between px-6">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center space-x-2">
              <span className="font-sans font-extrabold text-sm tracking-tight text-slate-950 dark:text-white">Workspace Hub</span>
              <span className="text-[10px] font-bold text-indigo-400 bg-indigo-950/40 px-2 py-0.5 rounded uppercase">Beta</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Quick theme toggler */}
            <button
              onClick={() => handleUpdateUserProfile({ theme: darkMode ? 'light' : 'dark' })}
              className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-950 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl transition-all text-slate-600 dark:text-slate-300 cursor-pointer"
            >
              {darkMode ? <Sun className="h-4.5 w-4.5 text-amber-500" /> : <Moon className="h-4.5 w-4.5" />}
            </button>

            <span className="text-xs text-slate-400 font-medium hidden sm:block">UTC: {new Date().toISOString().slice(11, 16)}</span>
          </div>
        </header>

        {/* WORKSPACE STAGE */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 max-w-7xl mx-auto w-full">
          {renderTabContent()}
        </main>
      </div>

      {/* FLOATING AI CHAT BOT ASSISTANT */}
      <AIChatBot activePaper={activePaper} />
    </div>
  );
}

function LoaderSpinner() {
  return (
    <div className="relative flex items-center justify-center">
      <div className="h-12 w-12 border-4 border-indigo-500/10 rounded-full" />
      <div className="absolute h-12 w-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
