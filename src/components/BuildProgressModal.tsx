import React, { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  Download,
  AlertCircle,
  Copy,
  Check,
  X,
  Globe,
  Zap,
  Code
} from 'lucide-react';
import type { BuildResult } from '../server/types.ts';

interface BuildProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  isBuilding: boolean;
  buildResult: BuildResult | null;
  error: string | null;
  onOpenCodeInspector?: () => void;
}

export const BuildProgressModal: React.FC<BuildProgressModalProps> = ({
  isOpen,
  onClose,
  isBuilding,
  buildResult,
  error,
  onOpenCodeInspector
}) => {
  const logEndRef = useRef<HTMLDivElement>(null);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [buildResult?.logs]);

  if (!isOpen) return null;

  const handleCopySnippet = () => {
    if (buildResult?.pwaSnippet) {
      navigator.clipboard.writeText(buildResult.pwaSnippet);
      setCopiedSnippet(true);
      setTimeout(() => setCopiedSnippet(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {isBuilding ? 'Generating Progressive Web App…' : buildResult ? 'PWA Package Ready to Deploy' : 'PWA Builder'}
              </h3>
              <p className="text-xs text-slate-400">
                {isBuilding
                  ? 'Compiling Web App Manifest, Service Worker, and offline engine…'
                  : buildResult
                  ? `${buildResult.appName} — Zero Android Studio Required`
                  : 'Synthesizing PWA package'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Tracker Strip */}
        <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isBuilding ? 'bg-amber-400 animate-pulse' : error ? 'bg-rose-500' : 'bg-emerald-400'}`} />
            <span className="text-slate-300 font-medium">
              {isBuilding ? 'Synthesizing manifest.webmanifest & Service Worker' : error ? 'Build halted' : 'Ready for 1-Click Deployment'}
            </span>
          </div>

          {buildResult && (
            <span className="text-emerald-400 font-mono text-[11px] font-semibold">
              ✓ 100% Android Studio Free
            </span>
          )}
        </div>

        {/* Terminal Logs View */}
        <div className="p-4 bg-[#070b13] font-mono text-xs text-slate-300 h-52 overflow-y-auto space-y-1">
          {buildResult?.logs?.map((line, idx) => (
            <div key={idx} className="flex gap-2">
              <span className="text-slate-600 select-none">&gt;</span>
              <span className={line.includes('PWA') || line.includes('Zero') ? 'text-emerald-300' : 'text-slate-300'}>
                {line}
              </span>
            </div>
          ))}

          {isBuilding && (
            <div className="flex items-center gap-2 text-indigo-400 py-2">
              <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              <span>Generating PWA manifest, service worker cache, and icons…</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-rose-400 py-1">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div ref={logEndRef} />
        </div>

        {/* Actions & Download Footer */}
        {buildResult && (
          <div className="p-6 bg-slate-900 border-t border-slate-800 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a
                href={buildResult.pwaDownloadUrl}
                download
                className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-600/25 transition-all text-center"
              >
                <Download className="w-4 h-4" />
                <span>Download PWA Package (ZIP)</span>
              </a>

              <a
                href={buildResult.zipDownloadUrl}
                download
                className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition-all text-center"
              >
                <Download className="w-4 h-4 text-indigo-400" />
                <span>Download Android Source (Optional)</span>
              </a>
            </div>

            {/* Quick HTML Snippet Copy Box */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Website &lt;head&gt; Snippet</span>
                </span>
                <button
                  type="button"
                  onClick={handleCopySnippet}
                  className="flex items-center gap-1 text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  {copiedSnippet ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedSnippet ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Drop the unzipped files into your website root, and paste this snippet into your HTML <code className="text-indigo-400">&lt;head&gt;</code> to make your site installable everywhere!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
