import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Lightbulb, 
  RefreshCw, 
  Copy, 
  Check, 
  Info, 
  ArrowRight, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';

export default function FeedbackAccordion({ report }) {
  if (!report) return null;

  const { grammarCorrections = [], vocabularySuggestions = [], cohesionSuggestions = [] } = report;
  const [openSection, setOpenSection] = useState('grammar');
  const [copiedId, setCopiedId] = useState(null);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-4">
      
      {/* 1. Grammar & Spelling Accordion Item */}
      <div className={`glass rounded-2xl overflow-hidden border transition-all duration-300 ${
        openSection === 'grammar' 
          ? 'border-[#CA8A04]/40 border-l-4 border-l-[#CA8A04]' 
          : 'border-[#44403C]/35'
      }`}>
        <button
          onClick={() => setOpenSection(openSection === 'grammar' ? null : 'grammar')}
          className="w-full flex justify-between items-center p-5 text-sm font-bold text-left text-[#FAFAF9] hover:bg-[#CA8A04]/5 transition-all duration-300 cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-4.5 w-4.5 text-[#CA8A04]" />
            <span>Grammar & Spelling ({grammarCorrections.length})</span>
          </div>
          {openSection === 'grammar' ? (
            <ChevronUp className="h-4 w-4 text-[#CA8A04]" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </button>

        {openSection === 'grammar' && (
          <div className="p-6 border-t border-[#44403C]/30 bg-[#1C1917]/25 space-y-4">
            {grammarCorrections.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center text-slate-500">
                <Check className="h-10 w-10 text-emerald-500 mb-2 p-2 bg-emerald-500/10 rounded-full" />
                <p className="text-sm font-semibold text-slate-350">Excellent Grammatical Accuracy!</p>
                <p className="text-xs max-w-sm mt-1">No grammatical or spelling slip-ups were detected in your essay.</p>
              </div>
            ) : (
              grammarCorrections.map((corr, idx) => (
                <div key={idx} className="p-4 bg-white/5 rounded-xl border border-[#44403C]/35 hover:border-[#CA8A04]/30 transition-all duration-300">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-semibold text-slate-455">Correction #{idx + 1}</span>
                    <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md ${
                      corr.severity === 'major' 
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {corr.severity} error
                    </span>
                  </div>

                  {/* Diff rendering boxes */}
                  <div className="space-y-2 mb-3">
                    {/* Mistake Card */}
                    <div className="p-3 bg-red-500/5 backdrop-blur-md rounded-xl border border-red-500/20 text-xs text-red-200/90 font-light line-through decoration-red-500/40 border-l-2 border-l-red-500">
                      {corr.original}
                    </div>
                    
                    <div className="flex items-center justify-center py-0.5 text-slate-600">
                      <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
                    </div>

                    {/* Improvement Card */}
                    <div className="p-3 bg-emerald-500/5 backdrop-blur-md rounded-xl border border-emerald-500/20 text-xs text-emerald-250 font-medium flex justify-between items-center border-l-2 border-l-emerald-500">
                      <span>{corr.improved}</span>
                      <button 
                        onClick={() => copyToClipboard(corr.improved, `g-${idx}`)}
                        className="p-1 hover:bg-[#44403C]/40 rounded text-[#CA8A04] transition-colors cursor-pointer"
                        title="Copy correction"
                      >
                        {copiedId === `g-${idx}` ? (
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Explanation Section */}
                  <div className="flex items-start gap-2 p-2 bg-[#1C1917]/60 rounded border border-[#44403C]/50 text-xs text-slate-400">
                    <Info className="h-4 w-4 text-[#CA8A04] shrink-0 mt-0.5" />
                    <span className="font-light">{corr.explanation}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* 2. Vocabulary Upgrades Accordion Item */}
      <div className={`glass rounded-2xl overflow-hidden border transition-all duration-300 ${
        openSection === 'vocab' 
          ? 'border-[#CA8A04]/40 border-l-4 border-l-[#CA8A04]' 
          : 'border-[#44403C]/35'
      }`}>
        <button
          onClick={() => setOpenSection(openSection === 'vocab' ? null : 'vocab')}
          className="w-full flex justify-between items-center p-5 text-sm font-bold text-left text-[#FAFAF9] hover:bg-[#CA8A04]/5 transition-all duration-300 cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Lightbulb className="h-4.5 w-4.5 text-[#CA8A04]" />
            <span>Vocabulary Upgrades ({vocabularySuggestions.length})</span>
          </div>
          {openSection === 'vocab' ? (
            <ChevronUp className="h-4 w-4 text-[#CA8A04]" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </button>

        {openSection === 'vocab' && (
          <div className="p-6 border-t border-[#44403C]/30 bg-[#1C1917]/25 space-y-4">
            {vocabularySuggestions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center text-slate-500">
                <Check className="h-10 w-10 text-[#CA8A04] mb-2 p-2 bg-[#CA8A04]/10 rounded-full" />
                <p className="text-sm font-semibold text-slate-350">Impressive Vocabulary Range!</p>
                <p className="text-xs max-w-sm mt-1">No simple word recommendations needed. Your lexical range is advanced.</p>
              </div>
            ) : (
              vocabularySuggestions.map((item, idx) => (
                <div key={idx} className="p-4 bg-white/5 rounded-xl border border-[#44403C]/35 hover:border-[#CA8A04]/30 transition-all duration-300">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-xs text-slate-400">Original word:</span>
                    <span className="px-2 py-0.5 bg-red-500/5 border border-red-500/20 text-red-400 rounded text-xs font-semibold">{item.word}</span>
                    <span className="text-xs text-slate-550">→ Upgrade to:</span>
                  </div>

                  {/* Synonym Pill List */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {item.alternatives.map((alt, aIdx) => (
                      <button
                        key={aIdx}
                        onClick={() => copyToClipboard(alt, `v-${idx}-${aIdx}`)}
                        className="flex items-center gap-1.5 px-3 py-1 bg-[#CA8A04]/10 hover:bg-[#CA8A04]/20 border border-[#CA8A04]/25 text-[#CA8A04] rounded-full text-xs font-medium transition-all duration-300 cursor-pointer"
                      >
                        {alt}
                        {copiedId === `v-${idx}-${aIdx}` ? (
                          <Check className="h-3 w-3 text-emerald-400" />
                        ) : (
                          <Copy className="h-3 w-3 opacity-55" />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Context Sentence */}
                  {item.context && (
                    <div className="text-xs text-slate-450 mb-2.5 italic font-light">
                      Context: "{item.context}"
                    </div>
                  )}

                  {/* Reason explanation */}
                  <div className="flex items-start gap-2 p-2 bg-[#1C1917]/60 rounded border border-[#44403C]/50 text-xs text-slate-450">
                    <Lightbulb className="h-4 w-4 text-[#CA8A04] shrink-0 mt-0.5" />
                    <span className="font-light">{item.explanation}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* 3. Cohesion & Flow Accordion Item */}
      <div className={`glass rounded-2xl overflow-hidden border transition-all duration-300 ${
        openSection === 'cohesion' 
          ? 'border-[#CA8A04]/40 border-l-4 border-l-[#CA8A04]' 
          : 'border-[#44403C]/35'
      }`}>
        <button
          onClick={() => setOpenSection(openSection === 'cohesion' ? null : 'cohesion')}
          className="w-full flex justify-between items-center p-5 text-sm font-bold text-left text-[#FAFAF9] hover:bg-[#CA8A04]/5 transition-all duration-300 cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <RefreshCw className="h-4.5 w-4.5 text-[#CA8A04]" />
            <span>Cohesion & Flow ({cohesionSuggestions.length})</span>
          </div>
          {openSection === 'cohesion' ? (
            <ChevronUp className="h-4 w-4 text-[#CA8A04]" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </button>

        {openSection === 'cohesion' && (
          <div className="p-6 border-t border-[#44403C]/30 bg-[#1C1917]/25 space-y-4">
            {cohesionSuggestions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center text-slate-500">
                <Check className="h-10 w-10 text-emerald-500 mb-2 p-2 bg-emerald-500/10 rounded-full" />
                <p className="text-sm font-semibold text-slate-350">Perfect Flow & Cohesion!</p>
                <p className="text-xs max-w-sm mt-1">Excellent logical progression and correct linking device usage.</p>
              </div>
            ) : (
              cohesionSuggestions.map((item, idx) => (
                <div key={idx} className="p-4 bg-white/5 rounded-xl border border-[#44403C]/35 hover:border-[#CA8A04]/30 transition-all duration-300 flex gap-3">
                  <div className="p-2 bg-[#44403C]/40 rounded-lg border border-[#CA8A04]/25 text-[#CA8A04] shrink-0 h-9 w-9 flex items-center justify-center font-bold text-sm uppercase">
                    {item.type ? item.type[0] : 'C'}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[#CA8A04] capitalize">{item.type} Improvement</span>
                    </div>
                    <p className="text-xs text-slate-200 font-semibold">{item.suggestion}</p>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-light">{item.explanation}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

    </div>
  );
}
