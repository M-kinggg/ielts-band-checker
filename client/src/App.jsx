import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { 
  PenTool, 
  History, 
  Trash2, 
  ArrowLeft, 
  Sparkles, 
  AlertCircle, 
  Download, 
  Award, 
  ChevronRight,
  BookOpen,
  HelpCircle,
  LogOut,
  User
} from 'lucide-react';
import ThreeBackground from './components/ThreeBackground';
import FileUploader from './components/FileUploader';
import ScoreDashboard from './components/ScoreDashboard';
import FeedbackAccordion from './components/FeedbackAccordion';
import AuthModal from './components/AuthModal';
import { useAuth } from './context/AuthContext';
import { supabase } from './lib/supabase';

export default function App() {
  // Auth Integration
  const { user, signOut } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Application States
  const [essayText, setEssayText] = useState('');
  const [taskType, setTaskType] = useState('task2');
  const [prompt, setPrompt] = useState('');
  const [targetBand, setTargetBand] = useState('7.0');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState(null);
  
  const [report, setReport] = useState(null);
  const [history, setHistory] = useState([]);

  // File Upload Metadata states
  const [fileName, setFileName] = useState(null);
  const [fileType, setFileType] = useState('typed');
  const [hasSaved, setHasSaved] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(() => {
    try {
      return localStorage.getItem('ielts_has_submitted') === 'true';
    } catch (e) {
      return false;
    }
  });

  // GSAP animation container refs
  const inputPanelRef = useRef(null);
  const resultsPanelRef = useRef(null);

  // Load local history on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('ielts_essay_history');
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load history:", e);
    }
  }, []);

  // Sync submission to Supabase
  const saveSubmissionToSupabase = async (reportData) => {
    if (!user || !supabase || hasSaved) return;

    try {
      const { error: dbError } = await supabase
        .from('submissions')
        .insert({
          user_id: user.id,
          task_type: taskType,
          essay_text: essayText,
          file_name: fileName || null,
          file_type: fileType || 'typed',
          overall_band: reportData.overallBand,
          score_ta: reportData.criteria.taskAchievement.score,
          score_cc: reportData.criteria.coherenceCohesion.score,
          score_lr: reportData.criteria.lexicalResource.score,
          score_gra: reportData.criteria.grammaticalRange.score,
          feedback_json: reportData,
        });

      if (dbError) throw dbError;
      setHasSaved(true);
      console.log("Submission successfully saved to Supabase.");
    } catch (err) {
      console.error("Failed to save submission to Supabase:", err.message);
    }
  };

  // Auto-sync active report when user logs in
  useEffect(() => {
    if (user && report && !hasSaved) {
      saveSubmissionToSupabase(report);
    }
  }, [user, report]);

  // Sync local history helper
  const saveToHistory = (newReport) => {
    const historyItem = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      taskType: taskType,
      prompt: prompt || 'No prompt text specified',
      overallBand: newReport.overallBand,
      wordCount: newReport.wordCount,
      report: newReport,
      targetBand: targetBand,
      fileName: fileName,
      fileType: fileType
    };

    const updatedHistory = [historyItem, ...history.slice(0, 19)];
    setHistory(updatedHistory);
    localStorage.setItem('ielts_essay_history', JSON.stringify(updatedHistory));
  };

  const clearHistory = () => {
    if (window.confirm("Are you sure you want to clear your grading history?")) {
      setHistory([]);
      localStorage.removeItem('ielts_essay_history');
    }
  };

  const deleteHistoryItem = (id, e) => {
    e.stopPropagation();
    const updated = history.filter(item => item.id !== id);
    setHistory(updated);
    localStorage.setItem('ielts_essay_history', JSON.stringify(updated));
  };

  // Loading animation loops
  useEffect(() => {
    let interval;
    if (isLoading) {
      setLoadingStep(0);
      const stepsCount = 4;
      interval = setInterval(() => {
        setLoadingStep(prev => (prev + 1) % stepsCount);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  // Loader texts
  const loadingMessages = [
    "Uploading essay and parsing structural blocks...",
    "Analyzing coherence, logical flow & cohesive devices...",
    "Scanning vocabulary complexity and lexical resource...",
    "Running grammatical checks and calculating band scores..."
  ];

  const getWordCount = () => {
    if (!essayText) return 0;
    return essayText.trim().split(/\s+/).filter(w => w.length > 0).length;
  };

  // Form submit handler
  const handleGradeSubmit = async (e) => {
    e.preventDefault();
    const words = getWordCount();

    if (words < 30) {
      setError("Your essay is too short! Please input at least 30 words to receive detailed band feedback.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setReport(null);
    setHasSaved(false);

    gsap.to(inputPanelRef.current, { opacity: 0.4, scale: 0.98, duration: 0.4 });

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const response = await fetch(`${API_URL}/api/grade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: essayText,
          taskType,
          prompt,
          targetBand
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to grade essay.");
      }

      setReport(data);
      saveToHistory(data);

      try {
        localStorage.setItem('ielts_has_submitted', 'true');
        setHasSubmitted(true);
      } catch (e) {
        console.warn("Failed to write to localStorage", e);
      }

      // Save submission directly if logged in
      if (user) {
        // Run database insert
        await saveSubmissionToSupabase(data);
      }

      setTimeout(() => {
        gsap.fromTo(resultsPanelRef.current, 
          { opacity: 0, y: 40 },
          { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }
        );
      }, 50);

    } catch (err) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during grading.");
      gsap.to(inputPanelRef.current, { opacity: 1, scale: 1, duration: 0.4 });
    } finally {
      setIsLoading(false);
    }
  };

  const loadHistoryItem = (item) => {
    setError(null);
    setEssayText(item.report.wordCount ? item.report.generalFeedback : '');
    setPrompt(item.prompt === 'No prompt text specified' ? '' : item.prompt);
    setTaskType(item.taskType);
    setTargetBand(item.targetBand || '7.0');
    setFileName(item.fileName || null);
    setFileType(item.fileType || 'typed');
    setReport(item.report);
    setHasSaved(true); // Treat loaded items as previously saved

    setTimeout(() => {
      gsap.fromTo(resultsPanelRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
      );
    }, 50);
  };

  const handleReset = () => {
    setReport(null);
    setError(null);
    setHasSaved(false);
    setTimeout(() => {
      gsap.fromTo(inputPanelRef.current,
        { opacity: 0, scale: 0.98 },
        { opacity: 1, scale: 1, duration: 0.5, ease: 'power2.out' }
      );
    }, 50);
  };

  const handleSignOutClick = async () => {
    await signOut();
    handleReset();
  };

  const loadSampleEssay = () => {
    setFileName(null);
    setFileType('typed');
    setHasSaved(false);

    if (taskType === 'task2') {
      setPrompt("Some people think that universities should provide graduates with the knowledge and skills needed in the workplace. Others think that the true function of a university should be to give access to knowledge for its own sake, regardless of whether the course is useful to an employer. Discuss both views and give your opinion.");
      setEssayText(`In modern society, there is an ongoing debate regarding the true purpose of higher education. While some individuals argue that universities should focus strictly on equipping students with practical skills tailored for the workplace, others believe that their primary function should be to disseminate knowledge for its own sake. In my opinion, I believe that universities must strike a balance between these two views.

On the one hand, a major argument in favor of practical vocational training is that it prepares graduates for immediate employment. In today's highly competitive job market, employers look for candidates who already possess technical capabilities. For instance, engineering or computer science degrees require students to understand programming languages and practical designs. By focusing on career-oriented training, universities can ensure that graduates are ready to contribute to the workforce immediately, which also helps to reduce unemployment rates.

On the other hand, many academics believe that universities should remain centers of pure learning. They argue that education is about broadening one's horizons and cultivating critical thinking skills. Access to knowledge in subjects like history, philosophy, or literature is valuable because it allows human beings to understand the world and their place in it. Furthermore, focusing solely on vocational courses might limit academic curiosity and research that do not have immediate financial benefits, which could eventually stall scientific and cultural progress.

In conclusion, although vocational preparation is extremely important for the economy, I think that the core value of higher education lies in combining both philosophies. Universities should offer practical courses while still encouraging theoretical research, thereby producing well-rounded graduates who are both employable and intellectually curious.`);
    } else {
      setPrompt("The graph below shows the percentage of people participating in various sports in a European country between 2005 and 2015.");
      setEssayText(`The line graph compares the proportions of individuals who participated in four different sports - football, swimming, tennis, and rugby - in a specific European nation over a ten-year period from 2005 to 2015.

Overall, it is clear that football remained the most popular sport throughout the entire timeframe, despite experiencing a minor decline. Conversely, swimming saw a steady rise in participation rates.

In 2005, football was the most favored activity, with roughly 40% of the population taking part. This percentage fluctuated slightly but showed a general downward trend, finishing at approximately 37% in 2015. On the other hand, participation in swimming started at 22% in 2005. It then grew steadily over the next ten years, overtaking tennis to reach a peak of 28% by the end of the period.

Tennis participation began at 25% and experienced a sudden drop to 20% in 2010, before recovering slightly to end at 23% in 2015. Meanwhile, rugby was consistently the least popular sport. Starting at a low of 10% in 2005, it hovered around this mark for most of the decade, showing only a minimal increase to 12% in 2015.`);
    }
  };

  const handleExport = () => {
    if (!report) return;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(report, null, 2))}`;
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", jsonString);
    downloadAnchorNode.setAttribute("download", `IELTS_Report_Band_${report.overallBand}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // Truncate user email helper
  const formatUserEmail = (email) => {
    if (!email) return '';
    const name = email.split('@')[0];
    return name.length > 12 ? `${name.slice(0, 10)}...` : name;
  };

  return (
    <div className="min-h-screen relative flex flex-col font-sans select-none text-slate-100">
      {/* 3D background */}
      <ThreeBackground />

      {/* Dark overlay for text readability */}
      <div style={{
        position: 'fixed',
        top: 0, left: 0,
        width: '100%', height: '100%',
        background: 'rgba(12,10,9,0.55)',
        zIndex: 1,
        pointerEvents: 'none'
      }} />

      {/* Main Container */}
      <div className="flex-1 flex flex-col w-full max-w-6xl mx-auto px-4 py-8" style={{ zIndex: 2, position: 'relative' }}>
        
        {/* Navigation Navbar */}
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#1C1917]/75 border-b border-[#44403C]/50 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 mb-10 shadow-lg transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#CA8A04]/10 border border-[#CA8A04]/30 rounded-xl shadow-lg shadow-yellow-600/10 text-[#CA8A04]">
              <PenTool className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-[#FAFAF9] via-[#FAFAF9] to-[#CA8A04] bg-clip-text text-transparent tracking-tight leading-tight m-0">
                IELTS Writing Grader
              </h1>
              <p className="text-xs text-[#CA8A04]/80 font-medium tracking-wide">Automated AI Band Scoring & Detailed Feedback</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden md:inline-block text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 bg-[#44403C]/30 border border-[#44403C]/50 rounded-full text-slate-300">
              Model: Gemini 1.5 Flash
            </span>

            <Link
              to="/history"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white/5 hover:bg-[#CA8A04]/10 border border-[#44403C] rounded-xl text-xs font-bold text-slate-300 hover:text-[#CA8A04] transition-all duration-300 cursor-pointer"
            >
              <History className="h-3.5 w-3.5 text-[#CA8A04]" />
              <span>History</span>
            </Link>

            {/* Auth Buttons */}
            {user ? (
              <div className="flex items-center gap-2 bg-[#44403C]/20 border border-[#44403C]/50 rounded-xl p-1">
                <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 font-medium">
                  <User className="h-3.5 w-3.5 text-[#CA8A04]" />
                  <span>Hi, {formatUserEmail(user.email)}</span>
                </div>
                <button
                  onClick={handleSignOutClick}
                  className="flex items-center gap-1 px-3 py-1.5 bg-[#44403C]/50 hover:bg-[#CA8A04]/20 border border-transparent hover:border-[#CA8A04]/30 rounded-lg text-xs font-semibold text-slate-300 hover:text-[#CA8A04] transition-all duration-300 cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
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

        {/* Layout Splitting */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* History Sidebar */}
          <aside className="lg:col-span-3 glass rounded-2xl p-4 space-y-4">
            <div className="flex justify-between items-center border-b border-[#44403C]/60 pb-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 uppercase tracking-wider">
                <History className="h-4 w-4 text-[#CA8A04]" />
                <span>My Drafts ({history.length})</span>
              </div>
              {history.length > 0 && (
                <button 
                  onClick={clearHistory}
                  className="p-1 text-slate-500 hover:text-red-400 rounded hover:bg-red-500/5 transition-colors cursor-pointer"
                  title="Clear history"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="py-6 text-center text-slate-500 text-xs font-light">
                No past submissions. Grade an essay to save history.
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {history.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => loadHistoryItem(item)}
                    className="p-3 bg-[#1C1917]/40 hover:bg-[#44403C]/20 border border-[#44403C]/50 hover:border-[#CA8A04]/55 rounded-xl cursor-pointer transition-all duration-300 group flex justify-between items-center"
                  >
                    <div className="space-y-1 min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-bold ${
                          item.taskType === 'task1' ? 'bg-[#CA8A04]/15 text-[#CA8A04]' : 'bg-[#FAFAF9]/15 text-[#FAFAF9]'
                        }`}>
                          {item.taskType === 'task1' ? 'Task 1' : 'Task 2'}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(item.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-300 truncate">{item.prompt}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-sm font-extrabold text-[#CA8A04]">
                        {item.overallBand.toFixed(1)}
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-600 group-hover:text-slate-450 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </aside>

          {/* Core Panel */}
          <main className="lg:col-span-9 space-y-6">
            
            {/* Loader */}
            {isLoading && (
              <div className="glass rounded-3xl p-8 flex flex-col items-center justify-center min-h-[400px] text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full scanner-line" />
                <div className="w-16 h-16 rounded-full border-4 border-t-[#CA8A04] border-r-[#CA8A04]/30 border-b-[#CA8A04]/10 border-l-[#CA8A04]/30 animate-spin mb-6" />
                
                <h3 className="text-lg font-bold text-[#CA8A04] animate-pulse-slow">Examiner evaluates essay...</h3>
                <p className="text-sm text-slate-300 max-w-sm mt-3 h-10 transition-all duration-500 font-light">
                  {loadingMessages[loadingStep]}
                </p>
                <div className="w-48 bg-[#44403C]/80 rounded-full h-1.5 mt-6 overflow-hidden">
                  <div 
                    className="h-full bg-[#CA8A04] rounded-full transition-all duration-1000"
                    style={{ width: `${(loadingStep + 1) * 25}%` }}
                  />
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && !isLoading && (
              <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-sm">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold mb-1">Grading Failed</h4>
                  <p className="font-light">{error}</p>
                </div>
              </div>
            )}

            {/* Editing Inputs Screen */}
            {!report && !isLoading && (
              <div ref={inputPanelRef} className="space-y-8 animate-in fade-in duration-600">
                {/* Hero Section */}
                <div className="text-center py-6 md:py-10 px-4 space-y-6">
                  <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#FAFAF9] font-display leading-tight">
                    Master the IELTS with <br className="sm:hidden" />
                    <span className="bg-gradient-to-r from-[#CA8A04] via-yellow-400 to-[#CA8A04] bg-clip-text text-transparent">Liquid Intelligence</span>
                  </h2>
                  <p className="text-slate-300 max-w-xl mx-auto text-sm md:text-base font-light leading-relaxed">
                    Instantly grade your Task 1 & 2 essays with professional accuracy. Receive detailed band score breakdowns, grammar corrections, and custom vocabulary recommendations.
                  </p>
                  <div className="pt-2 flex justify-center gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        const target = document.getElementById('essay-input-area');
                        if (target) target.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="px-6 py-3 bg-white/5 border border-[#CA8A04]/40 hover:border-[#CA8A04] text-[#CA8A04] hover:text-[#FAFAF9] rounded-xl text-xs font-bold transition-all duration-400 hover:shadow-[0_0_20px_rgba(202,138,4,0.3)] hover:bg-[#CA8A04]/20 cursor-pointer"
                    >
                      Start Free Assessment
                    </button>
                    <button
                      type="button"
                      onClick={loadSampleEssay}
                      className="px-6 py-3 bg-white/5 border border-white/10 hover:border-white/20 text-slate-350 hover:text-white rounded-xl text-xs font-bold transition-all duration-400 cursor-pointer"
                    >
                      Try Sample Essay
                    </button>
                  </div>
                </div>

                <form onSubmit={handleGradeSubmit} className="glass rounded-3xl p-6 md:p-8 space-y-6">
                  
                  {/* Task Configuration Form */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                    
                    <div className="md:col-span-5 space-y-2">
                      <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Writing Task Type</label>
                      <div className="flex border-b border-[#44403C]/60 pb-1">
                        <button
                          type="button"
                          onClick={() => setTaskType('task1')}
                          className={`flex-1 pb-2.5 text-xs font-bold tracking-wide transition-all duration-300 cursor-pointer ${
                            taskType === 'task1'
                              ? 'border-b-2 border-[#CA8A04] text-[#CA8A04]'
                              : 'text-slate-400 hover:text-slate-200 border-b-2 border-transparent'
                          }`}
                        >
                          Task 1 (Report/Letter)
                        </button>
                        <button
                          type="button"
                          onClick={() => setTaskType('task2')}
                          className={`flex-1 pb-2.5 text-xs font-bold tracking-wide transition-all duration-300 cursor-pointer ${
                            taskType === 'task2'
                              ? 'border-b-2 border-[#CA8A04] text-[#CA8A04]'
                              : 'text-slate-400 hover:text-slate-200 border-b-2 border-transparent'
                          }`}
                        >
                          Task 2 (Essay)
                        </button>
                      </div>
                    </div>

                    <div className="md:col-span-4 space-y-2">
                      <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Target Band Score</label>
                      <select
                        value={targetBand}
                        onChange={(e) => setTargetBand(e.target.value)}
                        className="w-full bg-[#1C1917]/60 hover:bg-[#1C1917]/80 text-sm border border-[#44403C] rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#CA8A04] focus:ring-2 focus:ring-[#CA8A04]/20 text-slate-200 transition-all duration-300 cursor-pointer font-sans"
                      >
                        {['5.0', '5.5', '6.0', '6.5', '7.0', '7.5', '8.0', '8.5', '9.0'].map(score => (
                          <option key={score} value={score} className="bg-[#1C1917] text-slate-200">Band {score}</option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-3">
                      <button
                        type="button"
                        onClick={loadSampleEssay}
                        className="w-full py-2.5 px-4 bg-[#44403C]/30 hover:bg-[#CA8A04]/10 border border-[#44403C]/60 hover:border-[#CA8A04]/40 rounded-xl text-xs font-bold text-[#CA8A04] hover:text-[#FAFAF9] transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <BookOpen className="h-4 w-4" />
                        Load Sample Draft
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                        Prompt / Topic Question
                        <span className="text-[10px] text-slate-500 font-normal">(Optional but recommended)</span>
                      </label>
                    </div>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder={
                        taskType === 'task1'
                          ? "E.g., The charts below show the percentage of water used for different purposes in six areas of the world..."
                          : "E.g., Some people think that scientific research should be focused on solving global health problems rather than exploring space..."
                      }
                      rows={2}
                      className="w-full bg-[#1C1917]/40 text-xs border border-[#44403C]/60 rounded-xl p-3 focus:outline-none focus:border-[#CA8A04] focus:ring-2 focus:ring-[#CA8A04]/20 text-slate-200 placeholder-slate-650 transition-all duration-300 resize-none font-sans"
                    />
                  </div>

                  {/* File Uploader */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Upload Essay File</label>
                    <FileUploader 
                      onTextExtracted={(text, name, type) => {
                        setEssayText(text);
                        setFileName(name);
                        setFileType(type);
                        setHasSaved(false);
                      }} 
                    />
                  </div>

                  {/* Typing area */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label id="essay-textarea-label" className="text-xs font-bold text-slate-300 uppercase tracking-wider">Your Essay Text</label>
                      <span className="text-xs text-slate-500 font-mono">
                        {getWordCount()} words | {essayText.length} chars
                      </span>
                    </div>
                    <textarea
                      id="essay-input-area"
                      value={essayText}
                      onChange={(e) => {
                        setEssayText(e.target.value);
                        setFileName(null);
                        setFileType('typed');
                        setHasSaved(false);
                      }}
                      placeholder={
                        taskType === 'task1'
                          ? "Type or paste your Task 1 essay here (minimum 150 words)..."
                          : "Type or paste your Task 2 essay here (minimum 250 words)..."
                      }
                      rows={12}
                      className="w-full bg-[#1C1917]/40 text-sm border border-[#44403C]/60 rounded-2xl p-4 focus:outline-none focus:border-[#CA8A04] focus:ring-2 focus:ring-[#CA8A04]/20 text-slate-200 placeholder-slate-650 transition-all duration-300 leading-relaxed font-light font-sans"
                    />
                  </div>

                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#1C1917]/60 border border-[#44403C]/40 text-slate-400 text-xs">
                    <HelpCircle className="h-4.5 w-4.5 shrink-0 text-[#CA8A04] mt-0.5" />
                    <span className="leading-relaxed font-light">
                      Task 1 requires at least 150 words. Task 2 requires 250 words. Essays under the limit will be penalized.
                    </span>
                  </div>

                  <button
                    type="submit"
                    className="btn-gold w-full text-base py-4"
                  >
                    <Sparkles className="h-4.5 w-4.5 animate-pulse" />
                    <span>Analyze Essay & Check Band</span>
                  </button>

                  {!hasSubmitted && (
                    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#CA8A04]/10 border border-[#CA8A04]/20 text-[#CA8A04] text-xs">
                      <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5 animate-pulse" />
                      <span className="leading-relaxed font-light text-left">
                        First analysis may take up to 60 seconds to load — our server wakes up on first request.
                      </span>
                    </div>
                  )}

                </form>
              </div>
            )}

            {/* Results Dashboard Panel */}
            {report && !isLoading && (
              <div ref={resultsPanelRef} className="space-y-6">
                
                {/* Control Subheader */}
                <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-[#44403C]/20 border border-[#44403C]/50 p-4 rounded-2xl backdrop-blur-md">
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 text-xs text-[#CA8A04] hover:text-[#CA8A04]/80 font-bold px-4 py-2 hover:bg-[#CA8A04]/10 rounded-xl transition-all duration-300 cursor-pointer"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Write Another Essay
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={handleExport}
                      className="flex items-center gap-1.5 text-xs text-slate-350 hover:text-white font-semibold px-3.5 py-2 bg-[#44403C]/50 hover:bg-[#CA8A04]/10 border border-[#44403C]/70 rounded-xl transition-all duration-300 cursor-pointer"
                    >
                      <Download className="h-4 w-4 text-[#CA8A04]" />
                      Export Data
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="flex items-center gap-1.5 text-xs text-slate-350 hover:text-white font-semibold px-3.5 py-2 bg-[#44403C]/50 hover:bg-[#CA8A04]/10 border border-[#44403C]/70 rounded-xl transition-all duration-300 cursor-pointer"
                    >
                      Print Report
                    </button>
                  </div>
                </div>

                {/* Score visuals */}
                <ScoreDashboard report={report} targetBand={targetBand} />

                {/* Soft Auth Banner callout for logged out users */}
                {!user && (
                  <div className="glass rounded-2xl p-5 border border-[#CA8A04]/30 bg-gradient-to-r from-[#CA8A04]/5 to-transparent flex flex-col sm:flex-row justify-between items-center gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#CA8A04]/10 rounded-full text-[#CA8A04]">
                        <Sparkles className="h-5 w-5 animate-pulse" />
                      </div>
                      <div className="space-y-0.5 text-left">
                        <p className="text-sm font-semibold text-[#FAFAF9]">Sign in to save this result and track your progress</p>
                        <p className="text-xs text-slate-450 font-light">Keep a chronological database record of all your IELTS essays and criteria band trajectories.</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsAuthModalOpen(true)}
                      className="px-5 py-2.5 bg-[#CA8A04] hover:bg-[#CA8A04]/90 text-[#0C0A09] rounded-xl text-xs font-extrabold transition-all duration-300 shadow-md shadow-yellow-600/10 hover:shadow-[#CA8A04]/35 whitespace-nowrap cursor-pointer hover:-translate-y-0.5"
                    >
                      Sign In
                    </button>
                  </div>
                )}

                {/* Detailed accordions */}
                <FeedbackAccordion report={report} />
                
              </div>
            )}

          </main>

        </div>

        {/* Footer info */}
        <footer className="mt-16 text-center text-xs text-slate-600 font-light pt-6 border-t border-slate-900">
          <p>© {new Date().getFullYear()} IELTS Writing Assistant. Evaluation metrics match the official public IELTS band descriptor guidelines.</p>
        </footer>

      </div>

      {/* Auth Modal dialogue */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
}
