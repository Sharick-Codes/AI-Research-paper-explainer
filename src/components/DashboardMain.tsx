import React, { useState, useRef } from 'react';
import { 
  Search, 
  Upload, 
  FileText, 
  Sparkles, 
  Bookmark, 
  Clock, 
  ChevronRight, 
  AlertCircle,
  TrendingUp,
  Award,
  Eye,
  Trash2,
  BookmarkCheck,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { extractTextFromPdf } from '../utils/pdfParser';
import { db, auth } from '../firebase';
import { doc, setDoc, collection, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Paper, UserProfile } from '../types';

interface DashboardMainProps {
  papers: Paper[];
  userProfile: UserProfile | null;
  onPaperSelected: (paper: Paper) => void;
  onRefreshPapers: () => Promise<void>;
  onUpdateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

export default function DashboardMain({
  papers,
  userProfile,
  onPaperSelected,
  onRefreshPapers,
  onUpdateUserProfile
}: DashboardMainProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle drag and drop states
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await handleFileProcess(e.target.files[0]);
    }
  };

  const handleFileProcess = async (file: File) => {
    if (file.type !== "application/pdf") {
      setError("Only academic research papers in PDF format are supported.");
      return;
    }

    setError(null);
    setUploadProgress(1);
    setUploadStatus("Reading PDF pages...");

    try {
      // 1. Extract plain text locally in browser
      const extracted = await extractTextFromPdf(file, (p) => {
        setUploadProgress(p);
      });

      setUploadStatus("Structuring document metadata...");
      
      // Calculate generic citation schemas based on Title
      const authorPlaceholder = "Scholar et al.";
      const currentYear = new Date().getFullYear();
      const citations = {
        apa: `${authorPlaceholder} (${currentYear}). ${extracted.title}. Journal of Academic Research Explainer.`,
        mla: `${authorPlaceholder}. "${extracted.title}." Journal of Academic Research Explainer, ${currentYear}.`,
        ieee: `${authorPlaceholder}, "${extracted.title}," Journal of Academic Research Explainer, ${currentYear}.`
      };

      // 2. Build our Paper object
      const paperId = "paper_" + Math.random().toString(36).substring(2, 11);
      const user = auth.currentUser;
      if (!user) {
        throw new Error("You must be logged in to upload and save research papers.");
      }

      setUploadStatus("Synchronizing with Firestore database...");

      const newPaper: Paper = {
        id: paperId,
        userId: user.uid,
        title: extracted.title,
        authors: authorPlaceholder,
        keywords: "Research, Academic, PDF",
        topic: "Uncategorized",
        uploadDate: new Date().toISOString(),
        extractedText: extracted.text,
        isSaved: false,
        readingProgress: 0,
        wordCount: extracted.wordCount,
        citations: citations
      };

      // 3. Write to Firestore user's papers collection
      const paperDocRef = doc(db, 'users', user.uid, 'papers', paperId);
      await setDoc(paperDocRef, newPaper);

      // 4. Update User stats
      const currentPaperCount = (userProfile?.paperCount || 0) + 1;
      const currentUsageCount = (userProfile?.aiUsageCount || 0) + 1;
      await onUpdateUserProfile({
        paperCount: currentPaperCount,
        aiUsageCount: currentUsageCount
      });

      setUploadStatus("Successfully processed! Loading your workspace...");
      setUploadProgress(100);

      await onRefreshPapers();

      setTimeout(() => {
        setUploadProgress(null);
        onPaperSelected(newPaper);
      }, 1000);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while parsing the PDF.");
      setUploadProgress(null);
    }
  };

  const handleToggleSave = async (e: React.MouseEvent, paper: Paper) => {
    e.stopPropagation();
    const user = auth.currentUser;
    if (!user) return;

    try {
      const paperDocRef = doc(db, 'users', user.uid, 'papers', paper.id);
      await updateDoc(paperDocRef, { isSaved: !paper.isSaved });
      await onRefreshPapers();
    } catch (err) {
      console.error("Failed to toggle save status:", err);
    }
  };

  const handleDeletePaper = async (e: React.MouseEvent, paper: Paper) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete "${paper.title}"? This will remove all associated chat histories and AI summaries.`)) {
      return;
    }

    const user = auth.currentUser;
    if (!user) return;

    try {
      const paperDocRef = doc(db, 'users', user.uid, 'papers', paper.id);
      await deleteDoc(paperDocRef);
      
      const currentPaperCount = Math.max(0, (userProfile?.paperCount || 1) - 1);
      await onUpdateUserProfile({
        paperCount: currentPaperCount
      });

      await onRefreshPapers();
    } catch (err) {
      console.error("Failed to delete paper:", err);
    }
  };

  const onUploadCardClick = () => {
    fileInputRef.current?.click();
  };

  // Filter papers based on search query
  const filteredPapers = papers.filter(p => {
    const query = searchQuery.toLowerCase();
    return (
      p.title.toLowerCase().includes(query) ||
      p.authors.toLowerCase().includes(query) ||
      p.keywords.toLowerCase().includes(query) ||
      p.topic.toLowerCase().includes(query)
    );
  });

  const savedPapers = papers.filter(p => p.isSaved);
  const recentPapers = [...papers]
    .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())
    .slice(0, 3);

  // Stats summaries
  const totalWordsAnalyzed = papers.reduce((acc, curr) => acc + (curr.wordCount || 0), 0);
  const averageProgress = papers.length > 0
    ? Math.round(papers.reduce((acc, curr) => acc + curr.readingProgress, 0) / papers.length)
    : 0;

  return (
    <div id="dashboard_main" className="space-y-8 font-sans pb-12 text-slate-800 dark:text-slate-200">
      {/* Search Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Welcome back. Organize, read, and explain your research materials.</p>
        </div>

        {/* Real-time search bar */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search papers by title, author, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full py-2.5 pl-12 pr-4 text-sm focus:outline-none focus:border-indigo-500/50 text-slate-800 dark:text-slate-200 transition-colors"
          />
        </div>
      </div>

      {/* Upload area or active progress */}
      {uploadProgress !== null ? (
        <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-indigo-500/20 rounded-3xl text-center space-y-4 shadow-xl">
          <div className="inline-flex p-3 bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 rounded-full animate-bounce">
            <Upload className="h-6 w-6" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-bold text-slate-900 dark:text-white">{uploadStatus}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Processing file: Please do not close your workspace browser tab.</p>
          </div>
          <div className="max-w-md mx-auto">
            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
              <div 
                className="h-full bg-indigo-500 transition-all duration-300 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500 mt-2 font-mono">
              <span>EXTRACTION PROGRESS</span>
              <span>{uploadProgress}%</span>
            </div>
          </div>
        </div>
      ) : (
        <div 
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={onUploadCardClick}
          className={`group p-12 border-2 border-dashed rounded-3xl text-center cursor-pointer transition-all duration-300 relative ${
            dragActive 
              ? 'border-indigo-500 bg-indigo-500/[0.02]' 
              : 'border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 bg-slate-50 dark:bg-slate-900/30'
          }`}
        >
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf"
            className="hidden"
          />
          <div className="inline-flex p-4 bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/10 rounded-full mb-4 group-hover:scale-110 transition-transform">
            <Upload className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-medium text-slate-850 dark:text-slate-200 mb-1">
            Drop your PDF here to start explaining
          </h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed mb-4">
            Supports IEEE, Nature, and ArXiv formats up to 50MB. Drag & drop or click to browse.
          </p>
          <span className="inline-flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-500/10 px-3.5 py-1.5 rounded-full">
            <Sparkles className="h-3.5 w-3.5 animate-pulse" />
            <span>Parses & Explains Instantly</span>
          </span>
          {error && (
            <p className="text-xs text-rose-500 dark:text-rose-400 mt-4 font-medium flex items-center justify-center space-x-1.5">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </p>
          )}
        </div>
      )}

      {/* Stats row & Bento cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Papers */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl flex items-center justify-between shadow-sm transition-colors">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Total Papers</span>
            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{papers.length}</h3>
          </div>
          <div className="p-3 bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <FileText className="h-6 w-6" />
          </div>
        </div>

        {/* Word Count */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl flex items-center justify-between shadow-sm transition-colors">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Words Parsed</span>
            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              {totalWordsAnalyzed > 1000000 
                ? `${(totalWordsAnalyzed / 1000000).toFixed(1)}M` 
                : totalWordsAnalyzed > 1000 
                ? `${Math.round(totalWordsAnalyzed / 1000)}k` 
                : totalWordsAnalyzed}
            </h3>
          </div>
          <div className="p-3 bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>

        {/* Average Reading Progress */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl flex items-center justify-between shadow-sm transition-colors">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Avg. Progress</span>
            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{averageProgress}%</h3>
          </div>
          <div className="p-3 bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <Award className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Recent papers table/list */}
      <div className="bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm transition-colors">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Your Research Library</h3>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{filteredPapers.length} articles found</span>
        </div>

        {filteredPapers.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <p className="text-sm text-slate-500 dark:text-slate-400">No research articles match your search or exist in your library.</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">Upload your first PDF above to get started explaining!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 font-semibold">
                  <th className="pb-3 pr-4">PAPER TITLE</th>
                  <th className="pb-3 pr-4 hidden sm:table-cell">UPLOAD DATE</th>
                  <th className="pb-3 pr-4 hidden md:table-cell">READING PROGRESS</th>
                  <th className="pb-3 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50 text-slate-800 dark:text-slate-200">
                {filteredPapers.map((paper) => (
                  <tr 
                    key={paper.id}
                    onClick={() => onPaperSelected(paper)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/30 cursor-pointer group transition-colors"
                  >
                    <td className="py-4 pr-4">
                      <div className="flex items-center space-x-3 max-w-md">
                        <div className="p-2 bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 rounded-xl flex-shrink-0">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="truncate">
                          <h4 className="text-sm font-bold text-slate-850 dark:text-slate-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {paper.title}
                          </h4>
                          <div className="flex items-center space-x-2 mt-0.5">
                            <span className="text-[10px] font-semibold text-slate-550 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded uppercase">{paper.topic}</span>
                            {paper.wordCount && (
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{Math.round(paper.wordCount / 1000)}k words</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 pr-4 text-xs font-medium text-slate-500 dark:text-slate-400 hidden sm:table-cell whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                        <span>{new Date(paper.uploadDate).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="py-4 pr-4 hidden md:table-cell">
                      <div className="w-28 space-y-1.5">
                        <div className="h-1.5 bg-slate-200 dark:bg-slate-850 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-indigo-500 rounded-full" 
                            style={{ width: `${paper.readingProgress}%` }}
                          />
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold font-mono">{paper.readingProgress}% COMPLETED</div>
                      </div>
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleToggleSave(e, paper)}
                          className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                            paper.isSaved 
                              ? 'bg-amber-100 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60 text-amber-600 dark:text-amber-500' 
                              : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-amber-500'
                          }`}
                        >
                          <Bookmark className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => handleDeletePaper(e, paper)}
                          className="p-2 rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-rose-100 dark:hover:bg-rose-950/20 border border-slate-200 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-900 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onPaperSelected(paper)}
                          className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow shadow-indigo-600/10 transition-colors cursor-pointer"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
