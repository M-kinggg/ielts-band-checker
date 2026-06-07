import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer
} from 'recharts';
import { Award, AlignLeft, BookOpen, CheckSquare, BookMarked, Target } from 'lucide-react';

export default function ScoreDashboard({ report, targetBand }) {
  if (!report) return null;

  const { overallBand, criteria, generalFeedback, wordCount } = report;

  // Prepare data for Radar Chart
  const radarData = [
    {
      subject: 'Task Achievement',
      score: criteria.taskAchievement.score,
      fullMark: 9,
    },
    {
      subject: 'Coherence & Cohesion',
      score: criteria.coherenceCohesion.score,
      fullMark: 9,
    },
    {
      subject: 'Lexical Resource',
      score: criteria.lexicalResource.score,
      fullMark: 9,
    },
    {
      subject: 'Grammar Range',
      score: criteria.grammaticalRange.score,
      fullMark: 9,
    },
  ];

  // Helper to color codes for band scores matching gold accents
  const getBandColorClass = (score) => {
    if (score >= 7.0) return 'text-[#CA8A04] border-[#CA8A04]/30 bg-[#CA8A04]/10';
    if (score >= 6.0) return 'text-[#CA8A04]/90 border-[#CA8A04]/20 bg-[#CA8A04]/5';
    if (score >= 5.0) return 'text-amber-400 border-amber-500/20 bg-amber-500/5';
    return 'text-red-400 border-red-500/20 bg-red-500/5';
  };

  const getCriterionIcon = (key) => {
    switch(key) {
      case 'taskAchievement':
        return <Award className="h-5 w-5 text-[#CA8A04]" />;
      case 'coherenceCohesion':
        return <AlignLeft className="h-5 w-5 text-[#CA8A04]" />;
      case 'lexicalResource':
        return <BookOpen className="h-5 w-5 text-[#CA8A04]" />;
      case 'grammaticalRange':
        return <CheckSquare className="h-5 w-5 text-[#CA8A04]" />;
      default:
        return <BookMarked className="h-5 w-5 text-slate-400" />;
    }
  };

  const getCriterionTitle = (key) => {
    switch(key) {
      case 'taskAchievement': return 'Task Achievement / Response';
      case 'coherenceCohesion': return 'Coherence and Cohesion';
      case 'lexicalResource': return 'Lexical Resource (Vocabulary)';
      case 'grammaticalRange': return 'Grammatical Range & Accuracy';
      default: return key;
    }
  };

  const parsedTarget = parseFloat(targetBand) || 7.0;
  const isTargetMet = overallBand >= parsedTarget;

  return (
    <div className="space-y-6">
      {/* Top Section: Overall Score and Radar Chart */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Overall Score Circle Card */}
        <div className="md:col-span-5 glass rounded-2xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
          {/* Decorative background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[#CA8A04]/10 blur-3xl rounded-full pointer-events-none" />
          
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Overall Evaluation</span>
          
          {/* Main Dial */}
          <div className="relative flex items-center justify-center w-40 h-40 rounded-full border-4 border-[#44403C]/50 bg-[#1C1917]/40 shadow-inner">
            {/* SVG circle stroke representation */}
            <svg className="absolute inset-0 w-full h-full transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="74"
                stroke="url(#goldGrad)"
                strokeWidth="6"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 74}`}
                strokeDashoffset={`${2 * Math.PI * 74 * (1 - overallBand / 9.0)}`}
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#CA8A04" />
                  <stop offset="100%" stopColor="#FAFAF9" />
                </linearGradient>
              </defs>
            </svg>
            
            <div className="flex flex-col items-center justify-center">
              <span className="text-6xl font-bold tracking-tight bg-gradient-to-r from-[#FAFAF9] via-[#CA8A04] to-[#FAFAF9] bg-clip-text text-transparent">
                {overallBand.toFixed(1)}
              </span>
              <span className="text-xs font-medium text-slate-400 mt-1">out of 9.0</span>
            </div>
          </div>

          {/* Target Info */}
          <div className="mt-5 w-full">
            <div className="flex justify-between items-center text-xs text-slate-400 mb-1 px-1">
              <div className="flex items-center gap-1">
                <Target className="h-3.5 w-3.5 text-[#CA8A04]" />
                <span>Target Band: {parsedTarget.toFixed(1)}</span>
              </div>
              <span className={isTargetMet ? 'text-[#CA8A04] font-semibold' : 'text-slate-400'}>
                {isTargetMet ? 'Target Met!' : `${(parsedTarget - overallBand).toFixed(1)} Band to Go`}
              </span>
            </div>
            <div className="w-full bg-[#1C1917] rounded-full h-2.5 overflow-hidden border border-[#44403C]/50">
              <div 
                className="h-full rounded-full bg-[#CA8A04] transition-all duration-1000"
                style={{ width: `${Math.min(100, (overallBand / parsedTarget) * 100)}%` }}
              />
            </div>
          </div>

          <div className="mt-4 flex gap-4 text-xs text-slate-450 border-t border-[#44403C]/50 pt-4 w-full justify-around">
            <div>
              <p className="font-bold text-[#FAFAF9]">{wordCount}</p>
              <p>Word Count</p>
            </div>
            <div className="border-r border-[#44403C]/50" />
            <div>
              <p className="font-bold text-[#FAFAF9]">
                {overallBand >= 7.0 ? 'C1' : overallBand >= 5.5 ? 'B2' : 'B1'}
              </p>
              <p>CEFR Level</p>
            </div>
          </div>
        </div>

        {/* Visual Graph: Radar Chart */}
        <div className="md:col-span-7 glass rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden bg-[#1C1917]/35">
          <div className="mb-2">
            <h3 className="text-sm font-semibold text-slate-300">Criteria Comparison</h3>
            <p className="text-xs text-slate-500 font-light">Visualization of performance across IELTS band metrics</p>
          </div>
          
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                <PolarGrid stroke="#44403C" />
                <PolarAngleAxis 
                  dataKey="subject" 
                  tick={{ fill: '#FAFAF9', fontSize: 10, fontWeight: 'bold' }} 
                />
                <PolarRadiusAxis 
                  angle={30} 
                  domain={[0, 9]} 
                  tick={{ fill: '#44403C', fontSize: 8 }}
                  stroke="#44403C"
                />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="#CA8A04"
                  fill="#CA8A04"
                  fillOpacity={0.2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* General Feedback Statement */}
      <div className="glass rounded-2xl p-5 border-l-4 border-l-[#CA8A04] relative overflow-hidden bg-white/5">
        <div className="absolute top-0 right-0 p-3 text-[#CA8A04] opacity-5 pointer-events-none">
          <Award className="h-20 w-20" />
        </div>
        <h3 className="text-sm font-bold text-[#CA8A04] flex items-center gap-1.5 mb-1.5">
          <Target className="h-4.5 w-4.5" />
          Examiner Overview
        </h3>
        <p className="text-sm text-slate-350 leading-relaxed font-light">{generalFeedback}</p>
      </div>

      {/* Grid of Criteria Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(criteria).map(([key, value]) => (
          <div 
            key={key} 
            className="rounded-xl p-5 flex flex-col justify-between space-y-3 transition-all duration-300 hover:border-[#CA8A04]/40 border border-[#CA8A04]/20 backdrop-blur-md cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-[#44403C]/35 rounded-lg border border-[#44403C]/60">
                  {getCriterionIcon(key)}
                </div>
                <h4 className="text-sm font-semibold text-slate-200">{getCriterionTitle(key)}</h4>
              </div>
              <div className={`text-sm font-bold px-2.5 py-1 rounded-md border ${getBandColorClass(value.score)}`}>
                Band {value.score.toFixed(1)}
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-light">{value.feedback}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
