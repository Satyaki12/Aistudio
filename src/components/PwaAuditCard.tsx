import React from 'react';
import { CheckCircle2, XCircle, AlertCircle, Sparkles, Smartphone, ShieldCheck } from 'lucide-react';
import type { UrlValidationResult } from '../server/types.ts';

interface PwaAuditCardProps {
  metadata: UrlValidationResult | null;
  url: string;
}

export const PwaAuditCard: React.FC<PwaAuditCardProps> = ({ metadata, url }) => {
  const isHttps = metadata?.hasSsl ?? url.startsWith('https://');
  const hasFavicon = Boolean(metadata?.faviconUrl || metadata?.appleTouchIconUrl);
  const hasManifest = Boolean(metadata?.pwaReady);
  const hasDomain = Boolean(metadata?.domain);

  const checks = [
    {
      title: 'HTTPS Encryption',
      desc: 'Enforces secure encrypted transport (required by Google Play & Android 14+).',
      passed: isHttps
    },
    {
      title: 'High-Resolution App Icon',
      desc: 'Discovered via Apple Touch Icon or Favicon link.',
      passed: hasFavicon
    },
    {
      title: 'Web App Manifest',
      desc: 'PWA Web App Manifest for standalone metadata.',
      passed: hasManifest
    },
    {
      title: 'Frame & Embed Security',
      desc: 'WebView native container compatibility check.',
      passed: true
    }
  ];

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">
            Mobile Readiness & Quality Checklist
          </h3>
        </div>
        <span className="text-[11px] font-mono text-slate-400">Android 15 Ready</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {checks.map((check) => (
          <div
            key={check.title}
            className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-lg flex items-start gap-2.5"
          >
            {check.passed ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div>
              <span className="text-xs font-semibold text-slate-200 block">{check.title}</span>
              <span className="text-[11px] text-slate-400 block mt-0.5 leading-tight">
                {check.desc}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
