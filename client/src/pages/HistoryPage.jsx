import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Trash2, 
  Search, 
  Loader2, 
  FileText, 
  Image as ImageIcon, 
  PenTool, 
  Calendar, 
  AlertCircle, 
  X, 
  ChevronRight, 
  Database, 
  History 
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import ScoreDashboard from '../components/ScoreDashboard';
import FeedbackAccordion from '../components/FeedbackAccordion';
import AuthModal from '../components/AuthModal';
import ThreeBackground from '../components/ThreeBackground';
import ProgressTracker from '../components/ProgressTracker';

export default function HistoryPage() {
  const { user, signOut } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  // Data State
  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Filters & Sorting States
  const [taskFilter, setTaskFilter] = useState('all'); // 'all' | 'task1' | 'task2'
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' | 'oldest' | 'highest' | 'lowest'
  const [searchQuery, setSearchQuery] = useState('');

  // Drawer Detail States
  const [activeSubmission, setActiveSubmission] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Deletion inline confirm states (stores ID of submission being confirmed)
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Fetch from Supabase
  const fetchHistory = async () => {
    if (!user) return;
    setIsLoading(true);
    setFetchError(null);

    if (!supabase) {
      // Mock history if Supabase is offline/unconfigured
      setTimeout(() => {
        setSubmissions(getMockSubmissions());
        setIsLoading(false);
      }, 1000);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (err) {
      console.error(err);
      setFetchError("Failed to retrieve submission history. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchHistory();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  // Handle Submission Deletion
  const handleDelete = async (id) => {
    // Optimistic Update: remove from local state immediately
    const previousSubmissions = [...submissions];
    setSubmissions(prev => prev.filter(sub => sub.id !== id));
    setDeleteConfirmId(null);

    if (!supabase) {
      console.log("Mock deletion completed (no Supabase client).");
      return;
    }

    try {
      const { error } = await supabase
        .from('submissions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      console.log("Submission deleted from database.");
    } catch (err) {
      console.error("Deletion failed:", err.message);
      // Restore previous state if DB delete fails
      setSubmissions(previousSubmissions);
      alert("Failed to delete the submission from the cloud database.");
    }
  };

  // Helper: Format Dates (e.g. "12 May 2026, 3:41 PM")
  const formatDateString = (dateStr) => {
    const date = new Date(dateStr);
    const day = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return `${day}, ${time}`;
  };

  // Helper: Get File Type Icon
  const getFileTypeIcon = (type) => {
    switch (type) {
      case 'pdf':
        return <FileText className="h-4 w-4 text-[#CA8A04]" title="PDF File" />;
      case 'docx':
        return <FileText className="h-4 w-4 text-[#CA8A04]/80" title="Word Document" />;
      case 'image':
        return <ImageIcon className="h-4 w-4 text-[#CA8A04]/60" title="Image Scan" />;
      default:
        return <PenTool className="h-4 w-4 text-slate-400" title="Typed text" />;
    }
  };

  // Filter & Sort Client-side logic
  const filteredSubmissions = submissions
    .filter(sub => {
      // 1. Task filter
      if (taskFilter !== 'all' && sub.task_type !== taskFilter) return false;
      
      // 2. Search query (file name or text snippet)
      if (searchQuery.trim().length > 0) {
        const query = searchQuery.toLowerCase();
        const matchesFile = sub.file_name ? sub.file_name.toLowerCase().includes(query) : false;
        const matchesText = sub.essay_text ? sub.essay_text.toLowerCase().slice(0, 200).includes(query) : false;
        return matchesFile || matchesText;
      }
      return true;
    })
    .sort((a, b) => {
      // Sort configurations
      if (sortOrder === 'newest') {
        return new Date(b.created_at) - new Date(a.created_at);
      }
      if (sortOrder === 'oldest') {
        return new Date(a.created_at) - new Date(b.created_at);
      }
      if (sortOrder === 'highest') {
        return parseFloat(b.overall_band) - parseFloat(a.overall_band);
      }
      if (sortOrder === 'lowest') {
        return parseFloat(a.overall_band) - parseFloat(b.overall_band);
      }
      return 0;
    });

  const openDrawer = (sub) => {
    setActiveSubmission(sub);
    setIsDrawerOpen(true);
    document.body.style.overflow = 'hidden'; // Lock background scroll
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    document.body.style.overflow = 'unset';
  };

  // Mock list generators
  const getMockSubmissions = () => [
    {
      id: 'mock-1',
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hrs ago
      task_type: 'task2',
      essay_text: "In modern society, there is an ongoing debate regarding the true purpose of higher education...",
      file_name: null,
      file_type: 'typed',
      overall_band: 7.0,
      score_ta: 7.5,
      score_cc: 7.0,
      score_lr: 6.5,
      score_gra: 7.0,
      feedback_json: {
        overallBand: 7.0,
        criteria: {
          taskAchievement: { score: 7.5, feedback: "Excellent evaluation of task. Clear position is established throughout." },
          coherenceCohesion: { score: 7.0, feedback: "Logical ordering is apparent, although cohesive devices could be enhanced." },
          lexicalResource: { score: 6.5, feedback: "Adequate range, though you tend to repeat basic words." },
          grammaticalRange: { score: 7.0, feedback: "A mix of simple and complex grammar. Control is generally good." }
        },
        grammarCorrections: [
          { original: "The graph show that...", improved: "The graph shows that...", explanation: "Singular noun expects singular verb.", severity: "major" }
        ],
        vocabularySuggestions: [
          { word: "important", alternatives: ["crucial", "paramount", "critical"], context: "...education is important...", explanation: "Use advanced academic synonyms." }
        ],
        cohesionSuggestions: [],
        generalFeedback: "This is a strong Task 2 essay. With vocabulary expansion, you can easily secure a band 7.5.",
        wordCount: 285
      }
    },
    {
      id: 'mock-2',
      created_at: new Date(Date.now() - 86400000 * 3).toISOString(), // 3 days ago
      task_type: 'task1',
      essay_text: "The charts below illustrate water usage trends across six geographical sectors...",
      file_name: "water_usage_report.pdf",
      file_type: 'pdf',
      overall_band: 6.0,
      score_ta: 6.0,
      score_cc: 6.5,
      score_lr: 5.5,
      score_gra: 6.0,
      feedback_json: {
        overallBand: 6.0,
        criteria: {
          taskAchievement: { score: 6.0, feedback: "Key features are highlighted, but details are sometimes missing." },
          coherenceCohesion: { score: 6.5, feedback: "Cohesive layout. Standard paragraph separation is logical." },
          lexicalResource: { score: 5.5, feedback: "Basic vocabulary selection. Repetitive descriptions of data trends." },
          grammaticalRange: { score: 6.0, feedback: "Frequent errors in prepositions and articles." }
        },
        grammarCorrections: [
          { original: "In the other hand...", improved: "On the other hand...", explanation: "Prepositional idiom error.", severity: "minor" }
        ],
        vocabularySuggestions: [],
        cohesionSuggestions: [],
        generalFeedback: "This Task 1 report is coherent, but vocabulary describing trends needs variation.",
        wordCount: 162
      }
    }
  ];

  return (
    <div className="min-h-screen relative flex flex-col font-sans select-none text-slate-100 pb-12 bg-[#1C1917]">
      {/* 3D background canvas */}
      <ThreeBackground />

      <div className="flex-1 flex flex-col w-full max-w-6xl mx-auto px-4 py-8 z-10">
        
        {/* Navigation Navbar */}
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#1C1917]/75 border-b border-[#44403C]/50 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 mb-10 shadow-lg transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#CA8A04]/10 border border-[#CA8A04]/30 rounded-xl shadow-lg shadow-yellow-600/10 text-[#CA8A04]">
              <History className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-[#FAFAF9] via-[#FAFAF9] to-[#CA8A04] bg-clip-text text-transparent tracking-tight leading-tight m-0">
                Evaluation History
              </h1>
              <p className="text-xs text-[#CA8A04]/80 font-medium tracking-wide">Archived IELTS band scores & reports</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Write Essay Link */}
            <Link
              to="/"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white/5 hover:bg-[#CA8A04]/10 border border-[#44403C] rounded-xl text-xs font-bold text-slate-300 hover:text-[#CA8A04] transition-all duration-300 cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-[#CA8A04]" />
              <span>Write Essay</span>
            </Link>

            {user ? (
              <div className="flex items-center gap-2 bg-[#44403C]/20 border border-[#44403C]/50 rounded-xl p-1">
                <div className="px-3 py-1.5 text-xs text-slate-300 font-medium">
                  Hi, {user.email.split('@')[0]}
                </div>
                <button
                  onClick={signOut}
                  className="px-3 py-1.5 bg-[#44403C]/50 hover:bg-[#CA8A04]/20 border border-transparent hover:border-[#CA8A04]/30 rounded-lg text-xs font-semibold text-slate-300 hover:text-[#CA8A04] transition-all duration-300 cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-4.5 py-2.5 bg-[#CA8A04] hover:bg-[#CA8A04]/90 text-[#0C0A09] rounded-xl text-xs font-bold transition-all duration-300 shadow-md shadow-yellow-600/10 hover:shadow-[#CA8A04]/35 hover:-translate-y-0.5 cursor-pointer"
              >
                Sign In
              </button>
            )}
          </div>
        </header>

        {/* Auth Guard Validation */}
        {!user && !isLoading && (
          <main className="flex-1 flex items-center justify-center py-20">
            <div className="glass rounded-3xl p-8 max-w-md w-full text-center space-y-6 border border-[#CA8A04]/25 shadow-xl relative overflow-hidden">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-[#CA8A04]/5 blur-3xl rounded-full pointer-events-none" />
              <div className="p-4 bg-[#CA8A04]/10 rounded-full w-16 h-16 flex items-center justify-center text-[#CA8A04] mx-auto border border-[#CA8A04]/20 animate-pulse">
                <Database className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-slate-200">Cloud Storage History</h2>
                <p className="text-xs text-slate-400 font-light leading-relaxed">
                  Sign in to view your complete database record of evaluated essays, sub-score balances, and historical band trends.
                </p>
              </div>
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="btn-gold w-full text-xs font-bold uppercase tracking-wider py-3.5 animate-in fade-in"
              >
                Sign In to My Account
              </button>
            </div>
          </main>
        )}

        {/* Loading Spinner */}
        {isLoading && (
          <main className="flex-1 flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="h-10 w-10 text-[#CA8A04] animate-spin" />
            <p className="text-xs text-slate-400 font-light">Loading database submissions...</p>
          </main>
        )}

        {/* Error notice */}
        {fetchError && !isLoading && (
          <main className="flex-1 flex items-center justify-center py-10">
            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-xs max-w-md">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p className="font-light">{fetchError}</p>
            </div>
          </main>
        )}

        {/* Authenticated Dashboard */}
        {user && !isLoading && !fetchError && (
          <main className="flex-1 space-y-6">
            
            {/* Progress Tracker Dashboard */}
            <ProgressTracker submissions={submissions} />

            {/* Filter & Search Controls bar */}
            <div className="glass rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
              
              {/* Search bar */}
              <div className="relative w-full md:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search file or essay text..."
                  className="w-full bg-[#1C1917]/65 text-xs border border-[#44403C] rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-[#CA8A04] focus:ring-2 focus:ring-[#CA8A04]/20 text-slate-200 placeholder-slate-650 transition-all duration-300"
                />
              </div>

              {/* Filters dropdowns */}
              <div className="flex flex-wrap w-full md:w-auto items-center gap-3 justify-end">
                
                {/* Task selection */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Task:</span>
                  <select
                    value={taskFilter}
                    onChange={(e) => setTaskFilter(e.target.value)}
                    className="bg-[#1C1917]/60 border border-[#44403C] text-xs text-slate-350 rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#CA8A04] transition-all duration-300 cursor-pointer"
                  >
                    <option value="all" className="bg-[#1C1917] text-slate-200">All Tasks</option>
                    <option value="task1" className="bg-[#1C1917] text-slate-200">Task 1 Only</option>
                    <option value="task2" className="bg-[#1C1917] text-slate-200">Task 2 Only</option>
                  </select>
                </div>

                {/* Sort Order */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Sort:</span>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="bg-[#1C1917]/60 border border-[#44403C] text-xs text-slate-350 rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#CA8A04] transition-all duration-300 cursor-pointer"
                  >
                    <option value="newest" className="bg-[#1C1917] text-slate-200">Newest First</option>
                    <option value="oldest" className="bg-[#1C1917] text-slate-200">Oldest First</option>
                    <option value="highest" className="bg-[#1C1917] text-slate-200">Highest Band</option>
                    <option value="lowest" className="bg-[#1C1917] text-slate-200">Lowest Band</option>
                  </select>
                </div>

              </div>
            </div>

            {/* List grid display */}
            {filteredSubmissions.length === 0 ? (
              
              /* Empty state */
              <div className="glass rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-5 border border-[#44403C]/30">
                <div className="p-4 bg-[#1C1917]/60 border border-[#44403C] text-slate-550 rounded-full w-14 h-14 flex items-center justify-center">
                  <History className="h-6 w-6 text-[#CA8A04]" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-sm font-bold text-slate-300">No matching submissions found</h3>
                  <p className="text-xs text-slate-500 font-light max-w-sm">
                    {submissions.length === 0 
                      ? "You haven't graded any essays yet under this account." 
                      : "No archives match your active search terms or filters."}
                  </p>
                </div>
                <Link
                  to="/"
                  className="btn-gold text-xs font-bold"
                >
                  Grade your first essay →
                </Link>
              </div>

            ) : (

              /* Cards grid */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredSubmissions.map((sub) => (
                  <div 
                    key={sub.id} 
                    className="glass rounded-2xl p-5 border border-[#44403C]/40 hover:border-[#CA8A04]/40 hover:bg-[#CA8A04]/5 transition-all duration-300 flex flex-col justify-between space-y-4"
                  >
                    
                    {/* Top Row: Date, Task and File icon */}
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-bold ${
                            sub.task_type === 'task1' ? 'bg-[#CA8A04]/15 text-[#CA8A04]' : 'bg-[#FAFAF9]/15 text-[#FAFAF9]'
                          }`}>
                            {sub.task_type === 'task1' ? 'Task 1' : 'Task 2'}
                          </span>
                          <div className="flex items-center gap-1 p-1 bg-[#1C1917]/40 rounded border border-[#44403C]/40">
                            {getFileTypeIcon(sub.file_type)}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500">
                          <Calendar className="h-3 w-3 shrink-0" />
                          <span>{formatDateString(sub.created_at)}</span>
                        </div>
                      </div>

                      {/* Delete buttons with inline confirmations */}
                      {deleteConfirmId === sub.id ? (
                        <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-right-1 duration-150">
                          <button
                            onClick={() => handleDelete(sub.id)}
                            className="px-3 py-1 bg-[#CA8A04] hover:bg-[#CA8A04]/90 text-[#0C0A09] text-[10px] font-bold rounded-lg transition-all duration-300 shadow-md shadow-yellow-600/10 cursor-pointer"
                          >
                            Confirm Delete
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-3 py-1 bg-[#44403C]/50 hover:bg-[#44403C] text-slate-350 text-[10px] font-bold rounded-lg border border-[#44403C] transition-all duration-300 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(sub.id)}
                          className="p-1.5 text-slate-650 hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-all cursor-pointer"
                          title="Delete submission"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Metadata summary (Filename / snippet) */}
                    <div>
                      <p className="text-xs font-semibold text-slate-200 truncate">
                        {sub.file_name || "Typed Essay"}
                      </p>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-normal font-light italic">
                        "{sub.essay_text.slice(0, 120)}..."
                      </p>
                    </div>

                    {/* Score visuals row */}
                    <div className="flex items-center justify-between border-t border-[#44403C]/40 pt-3.5 mt-2">
                      <div className="flex flex-col text-left">
                        <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Overall Band</span>
                        <span className="text-2xl font-extrabold px-3 py-1.5 rounded-lg border mt-1 shrink-0 text-[#CA8A04] border-[#CA8A04]/30 bg-[#CA8A04]/10 shadow-[0_0_10px_rgba(202,138,4,0.1)]">
                          {parseFloat(sub.overall_band).toFixed(1)}
                        </span>
                      </div>

                      {/* Mini pills */}
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Sub-Scores</span>
                        <div className="flex gap-1.5 mt-1.5">
                          {[['TA', sub.score_ta], ['CC', sub.score_cc], ['LR', sub.score_lr], ['GRA', sub.score_gra]].map(([label, score]) => (
                            <div key={label} className="flex flex-col items-center">
                              <span className="text-[8px] font-bold text-slate-550">{label}</span>
                              <span className="text-[10px] font-bold text-[#CA8A04] bg-[#CA8A04]/10 border border-[#CA8A04]/25 rounded px-1.5 py-0.5 mt-0.5 min-w-[20px] text-center shadow-[0_0_5px_rgba(202,138,4,0.05)]">
                                {score ? parseFloat(score).toFixed(1) : '-'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Drawer open action button */}
                    <button
                      onClick={() => openDrawer(sub)}
                      className="w-full py-2.5 bg-[#44403C]/30 hover:bg-[#CA8A04]/10 border border-[#44403C]/50 hover:border-[#CA8A04]/40 text-[#CA8A04] rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1 cursor-pointer mt-2"
                    >
                      <span>View Full Report</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>

                  </div>
                ))}
              </div>

            )}

          </main>
        )}

      </div>

      {/* Slide-in Detail Drawer Overlay */}
      {isDrawerOpen && activeSubmission && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Drawer Backdrop */}
          <div 
            onClick={closeDrawer}
            className="absolute inset-0 bg-[#1C1917]/80 backdrop-blur-sm animate-in fade-in duration-300"
          />

          {/* Drawer panel */}
          <div 
            className="absolute right-0 top-0 bottom-0 w-full max-w-3xl border-l p-6 overflow-y-auto z-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 ease-out"
            style={{
              background: 'rgba(28,25,23,0.85)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderLeft: '1px solid rgba(202,138,4,0.3)'
            }}
          >
            
            {/* Drawer Header */}
            <div className="flex justify-between items-center border-b border-[#44403C]/50 pb-4 mb-6 shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] uppercase px-2 py-0.5 rounded font-bold ${
                    activeSubmission.task_type === 'task1' ? 'bg-[#CA8A04]/15 text-[#CA8A04]' : 'bg-[#FAFAF9]/15 text-[#FAFAF9]'
                  }`}>
                    {activeSubmission.task_type === 'task1' ? 'Task 1 Report' : 'Task 2 Essay'}
                  </span>
                  <span className="text-xs text-slate-500">
                    {formatDateString(activeSubmission.created_at)}
                  </span>
                </div>
                <h2 className="text-sm font-bold text-slate-200 truncate max-w-md">
                  {activeSubmission.file_name || "Typed Essay Submission"}
                </h2>
              </div>

              {/* Close icon */}
              <button
                onClick={closeDrawer}
                className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-[#CA8A04] transition-all duration-300 cursor-pointer"
                title="Close drawer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Original Submission Text Collapsible details */}
            <details className="mb-6 bg-white/5 border border-[#44403C]/50 rounded-xl overflow-hidden shrink-0 group">
              <summary className="px-4 py-3 text-xs font-semibold text-slate-300 hover:text-[#CA8A04] cursor-pointer flex justify-between items-center list-none select-none transition-colors duration-350">
                <div className="flex items-center gap-1.5">
                  <PenTool className="h-3.5 w-3.5 text-[#CA8A04]" />
                  <span>Show Original Essay Text</span>
                </div>
                <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90 text-slate-500" />
              </summary>
              <div className="px-4 pb-4 pt-1 border-t border-[#44403C]/30">
                <div className="bg-[#1C1917]/50 rounded-lg p-3 text-xs text-slate-250 leading-relaxed font-light whitespace-pre-wrap max-h-48 overflow-y-auto font-sans">
                  {activeSubmission.essay_text}
                </div>
              </div>
            </details>

            {/* Main Evaluation dashboards */}
            <div className="flex-1 space-y-6">
              {/* Score visual gauges / Radar */}
              <ScoreDashboard 
                report={activeSubmission.feedback_json} 
                targetBand={activeSubmission.feedback_json.targetBand || 7.0} 
              />
              
              {/* Tabbed accordion breakdowns */}
              <FeedbackAccordion report={activeSubmission.feedback_json} />
            </div>

          </div>
        </div>
      )}

      {/* Auth Modal dialogue */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
}
