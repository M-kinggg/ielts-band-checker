import React, { useState } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine 
} from 'recharts';
import { 
  TrendingUp, 
  Sparkles,
  ArrowUp,
  ArrowDown,
  Minus,
  Target,
  AlertCircle
} from 'lucide-react';

export default function ProgressTracker({ submissions = [] }) {
  if (submissions.length < 3) return null;

  // Toggle states for criteria lines on chart
  const [showTA, setShowTA] = useState(false);
  const [showCC, setShowCC] = useState(false);
  const [showLR, setShowLR] = useState(false);
  const [showGRA, setShowGRA] = useState(false);

  // Sort chronological order (oldest to newest) for chart representation
  const chronSubmissions = [...submissions].reverse();
  
  // Format Date (e.g. "12 May")
  const formatDateShort = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  // Chart data mapping
  const chartData = chronSubmissions.map((sub, idx) => ({
    name: formatDateShort(sub.created_at),
    idx: idx + 1,
    'Overall Band': parseFloat(sub.overall_band),
    'Task Achievement': parseFloat(sub.score_ta || 0),
    'Coherence & Cohesion': parseFloat(sub.score_cc || 0),
    'Lexical Resource': parseFloat(sub.score_lr || 0),
    'Grammar Range': parseFloat(sub.score_gra || 0)
  }));

  // Math Statistics Calculations
  const latest = submissions[0];
  const previous = submissions[1];
  const oldest = submissions[submissions.length - 1];

  const latestOverall = parseFloat(latest.overall_band);
  const oldestOverall = parseFloat(oldest.overall_band);
  const improvement = latestOverall - oldestOverall;

  const bestBand = Math.max(...submissions.map(sub => parseFloat(sub.overall_band)));
  const totalSubmissions = submissions.length;

  // Calculate Deltas for the 4 criteria (latest vs previous)
  const criteriaKeys = [
    { key: 'score_ta', name: 'Task Achievement', label: 'TA' },
    { key: 'score_cc', name: 'Coherence & Cohesion', label: 'CC' },
    { key: 'score_lr', name: 'Lexical Resource', label: 'LR' },
    { key: 'score_gra', name: 'Grammar Range', label: 'GRA' }
  ];

  const deltas = criteriaKeys.map(({ key, name, label }) => {
    const latestVal = parseFloat(latest[key] || 0);
    const prevVal = parseFloat(previous[key] || 0);
    const diff = latestVal - prevVal;
    return { name, label, diff, latestVal, prevVal };
  });

  // Most Improved calculation (highest positive delta between latest and previous)
  let mostImprovedText = 'None (N/A)';
  let maxDiff = 0;
  deltas.forEach(d => {
    if (d.diff > maxDiff) {
      maxDiff = d.diff;
      mostImprovedText = `${d.name} (+${d.diff.toFixed(1)})`;
    }
  });

  // Focus Area calculation (criterion with lowest average across all submissions)
  const focusAreaAverages = criteriaKeys.map(({ key, name }) => {
    const sum = submissions.reduce((acc, sub) => acc + parseFloat(sub[key] || 0), 0);
    const avg = sum / totalSubmissions;
    return { name, avg };
  });

  // Find lowest average
  const sortedAverages = [...focusAreaAverages].sort((a, b) => a.avg - b.avg);
  const focusAreaText = `${sortedAverages[0].name} (Avg: ${sortedAverages[0].avg.toFixed(1)})`;

  // Helper to render delta arrows
  const renderDeltaArrow = (diff) => {
    if (diff > 0) {
      return (
        <span className="flex items-center text-emerald-400 text-xs font-bold gap-0.5">
          <ArrowUp className="h-3 w-3 animate-bounce" />
          <span>+{diff.toFixed(1)}</span>
        </span>
      );
    }
    if (diff < 0) {
      return (
        <span className="flex items-center text-rose-455 text-xs font-bold gap-0.5">
          <ArrowDown className="h-3 w-3" />
          <span>{diff.toFixed(1)}</span>
        </span>
      );
    }
    return (
      <span className="flex items-center text-slate-500 text-xs font-bold gap-0.5">
        <Minus className="h-3 w-3" />
        <span>0.0</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Motivational Banner */}
      {improvement > 0 ? (
        <div className="glass-gold rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-[#CA8A04]/10 rounded-full text-[#CA8A04]">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
            <p className="text-sm font-semibold text-[#CA8A04]">
              You've improved by {improvement.toFixed(1)} bands since you started! Keep going 🎯
            </p>
          </div>
        </div>
      ) : (
        <div className="glass rounded-2xl p-4 border border-[#44403C]/35 bg-[#CA8A04]/5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-[#CA8A04]/10 rounded-full text-[#CA8A04]">
              <TrendingUp className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-[#FAFAF9]">
              Keep practicing — improvement takes time.
            </p>
          </div>
        </div>
      )}

      {/* Main Trends and Deltas Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Overall Band Line Chart */}
        <div className="lg:col-span-8 glass rounded-2xl p-5 flex flex-col justify-between space-y-4 bg-[#1C1917]/35 border border-[#44403C]/40">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-bold text-[#FAFAF9]">Writing Progress Trajectory</h3>
              <p className="text-xs text-slate-500">Chronological analysis of criteria scores</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Target className="h-4 w-4 text-[#CA8A04]" />
              <span className="font-semibold text-[#CA8A04]">Target: Band 7.0</span>
            </div>
          </div>

          {/* Recharts chart */}
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 15, left: -25, bottom: 5 }}>
                <CartesianGrid stroke="#44403C" strokeDasharray="3 3" opacity={0.3} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#a0aec0', fontSize: 10 }}
                  stroke="#44403C"
                />
                <YAxis 
                  domain={[0, 9]} 
                  ticks={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]}
                  tick={{ fill: '#a0aec0', fontSize: 10 }}
                  stroke="#44403C"
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1C1917', borderColor: 'rgba(202,138,4,0.3)', borderRadius: '12px' }}
                  labelStyle={{ fontWeight: 'bold', color: '#FAFAF9', fontSize: 11 }}
                  itemStyle={{ fontSize: 11, color: '#CA8A04' }}
                />
                <ReferenceLine 
                  y={7} 
                  stroke="#CA8A04" 
                  strokeDasharray="4 4" 
                  label={{ value: 'Band 7 target', fill: '#CA8A04', fontSize: 9, position: 'top', fontWeight: 'bold' }} 
                />
                
                {/* Overall Band Line (Gold) */}
                <Line 
                  type="monotone" 
                  dataKey="Overall Band" 
                  stroke="#CA8A04" 
                  strokeWidth={3}
                  activeDot={{ r: 6, fill: '#CA8A04', stroke: '#FAFAF9' }} 
                  animationDuration={800}
                />
                
                {/* Toggleable Criteria Lines */}
                {showTA && (
                  <Line type="monotone" dataKey="Task Achievement" stroke="#f472b6" strokeWidth={1.5} animationDuration={500} />
                )}
                {showCC && (
                  <Line type="monotone" dataKey="Coherence & Cohesion" stroke="#22d3ee" strokeWidth={1.5} animationDuration={500} />
                )}
                {showLR && (
                  <Line type="monotone" dataKey="Lexical Resource" stroke="#c084fc" strokeWidth={1.5} animationDuration={500} />
                )}
                {showGRA && (
                  <Line type="monotone" dataKey="Grammar Range" stroke="#34d399" strokeWidth={1.5} animationDuration={500} />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Toggle Checklist legend */}
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-[#44403C]/30 pt-3 text-xs">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Subscores:</span>
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-400 hover:text-slate-200 transition-colors">
              <input 
                type="checkbox" 
                checked={showTA} 
                onChange={(e) => setShowTA(e.target.checked)}
                className="accent-[#CA8A04] rounded" 
              />
              <span className="text-[11px] font-medium">Task Achievement</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-400 hover:text-slate-200 transition-colors">
              <input 
                type="checkbox" 
                checked={showCC} 
                onChange={(e) => setShowCC(e.target.checked)}
                className="accent-[#CA8A04] rounded" 
              />
              <span className="text-[11px] font-medium">Coherence & Cohesion</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-400 hover:text-slate-200 transition-colors">
              <input 
                type="checkbox" 
                checked={showLR} 
                onChange={(e) => setShowLR(e.target.checked)}
                className="accent-[#CA8A04] rounded" 
              />
              <span className="text-[11px] font-medium">Lexical Resource</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-400 hover:text-slate-200 transition-colors">
              <input 
                type="checkbox" 
                checked={showGRA} 
                onChange={(e) => setShowGRA(e.target.checked)}
                className="accent-[#CA8A04] rounded" 
              />
              <span className="text-[11px] font-medium">Grammar Range</span>
            </label>
          </div>
        </div>

        {/* Right side: Criteria Improvement Deltas */}
        <div className="lg:col-span-4 glass rounded-2xl p-5 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-bold text-[#FAFAF9]">Criteria Shift</h3>
            <p className="text-xs text-slate-500">Latest vs previous submission delta</p>
          </div>

          <div className="space-y-3 my-2">
            {deltas.map((d) => (
              <div 
                key={d.name} 
                className="flex justify-between items-center p-2.5 bg-[#1C1917]/50 border border-[#44403C]/50 rounded-xl hover:border-[#CA8A04]/25 transition-all duration-300"
              >
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold text-slate-350">{d.name}</span>
                  <span className="text-[10px] text-slate-500 font-light">Previous: {d.prevVal.toFixed(1)} → Latest: {d.latestVal.toFixed(1)}</span>
                </div>
                <div>
                  {renderDeltaArrow(d.diff)}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 p-2.5 bg-[#CA8A04]/5 border border-[#CA8A04]/25 rounded-xl text-[10px] text-[#CA8A04] font-light leading-normal">
            <AlertCircle className="h-4.5 w-4.5 shrink-0 text-[#CA8A04]" />
            <span>Arrows compare your latest attempt with the previous one. Keep them pointing up!</span>
          </div>
        </div>

      </div>

      {/* Row of 5 Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        
        {/* Latest overall */}
        <div className="glass rounded-xl p-4 flex flex-col text-left justify-between space-y-1 border border-[#44403C]/45 hover:border-[#CA8A04]/40 hover:bg-[#CA8A04]/5 transition-all duration-300">
          <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Latest Overall</span>
          <p className="text-2xl font-black text-[#CA8A04] mt-1">{latestOverall.toFixed(1)}</p>
          <span className="text-[10px] text-slate-400">band score</span>
        </div>

        {/* Best overall */}
        <div className="glass rounded-xl p-4 flex flex-col text-left justify-between space-y-1 border border-[#44403C]/45 hover:border-[#CA8A04]/40 hover:bg-[#CA8A04]/5 transition-all duration-300">
          <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Best Band Ever</span>
          <p className="text-2xl font-black text-[#CA8A04] mt-1">{bestBand.toFixed(1)}</p>
          <span className="text-[10px] text-slate-400">max score achieved</span>
        </div>

        {/* Total submissions */}
        <div className="glass rounded-xl p-4 flex flex-col text-left justify-between space-y-1 border border-[#44403C]/45 hover:border-[#CA8A04]/40 hover:bg-[#CA8A04]/5 transition-all duration-300">
          <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Total Attempts</span>
          <p className="text-2xl font-black text-[#CA8A04] mt-1">{totalSubmissions}</p>
          <span className="text-[10px] text-slate-400">graded submissions</span>
        </div>

        {/* Most improved */}
        <div className="glass rounded-xl p-4 flex flex-col text-left justify-between space-y-1 border border-[#44403C]/45 hover:border-[#CA8A04]/40 hover:bg-[#CA8A04]/5 transition-all duration-300">
          <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Most Improved</span>
          <p className="text-xs font-bold text-[#CA8A04] mt-2 truncate">{mostImprovedText.split(' ')[0]}</p>
          <span className="text-[10px] text-slate-400 font-medium">
            {mostImprovedText.includes('(') ? mostImprovedText.substring(mostImprovedText.indexOf('(')) : 'no change'}
          </span>
        </div>

        {/* Focus Area */}
        <div className="glass rounded-xl p-4 flex flex-col text-left justify-between space-y-1 col-span-2 md:col-span-1 border border-[#44403C]/45 hover:border-[#CA8A04]/40 hover:bg-[#CA8A04]/5 transition-all duration-300">
          <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Focus Area</span>
          <p className="text-xs font-bold text-rose-455 mt-2 truncate">{focusAreaText.split(' ')[0]}</p>
          <span className="text-[10px] text-slate-400 font-medium">
            {focusAreaText.includes('(') ? focusAreaText.substring(focusAreaText.indexOf('(')) : 'lowest avg'}
          </span>
        </div>

      </div>

    </div>
  );
}
