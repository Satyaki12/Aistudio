import React from 'react';
import {
  Globe,
  Zap,
  CheckCircle2,
  XCircle,
  Smartphone,
  Layers,
  Sparkles,
  Server,
  Share2
} from 'lucide-react';

export const PwaGuide: React.FC = () => {
  return (
    <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold mb-1">
          <Zap className="w-4 h-4" />
          <span>Architecture & Platform Strategy</span>
        </div>
        <h2 className="text-base font-bold text-white">
          Why Progressive Web Apps (PWA) Beat Native APKs for Websites
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Everything you need to know about eliminating Android Studio, achieving universal cross-platform reach, and deploying in under 3 minutes.
        </p>
      </div>

      {/* Side-by-side Comparison Matrix */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-2.5 pr-4">Feature</th>
              <th className="py-2.5 px-4 text-emerald-400 bg-emerald-950/20 rounded-t-lg">
                Progressive Web App (PWA)
              </th>
              <th className="py-2.5 pl-4 text-slate-400">Android APK Wrapper</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            <tr>
              <td className="py-3 pr-4 font-medium text-white">Android Studio Setup</td>
              <td className="py-3 px-4 bg-emerald-950/10 font-bold text-emerald-400">
                ✓ Not Required (0 MB)
              </td>
              <td className="py-3 pl-4 text-slate-400">Requires 4GB+ Android SDK & JDK 17</td>
            </tr>
            <tr>
              <td className="py-3 pr-4 font-medium text-white">Device Support</td>
              <td className="py-3 px-4 bg-emerald-950/10 font-semibold text-emerald-300">
                ✓ Android, iOS (iPhone/iPad), Mac, Windows
              </td>
              <td className="py-3 pl-4 text-slate-400">Android devices only</td>
            </tr>
            <tr>
              <td className="py-3 pr-4 font-medium text-white">Publishing & Fees</td>
              <td className="py-3 px-4 bg-emerald-950/10 font-semibold text-emerald-300">
                ✓ Free · Instant · No Play Store account ($25)
              </td>
              <td className="py-3 pl-4 text-slate-400">$25 Google Play fee + policy review</td>
            </tr>
            <tr>
              <td className="py-3 pr-4 font-medium text-white">Update Delivery</td>
              <td className="py-3 px-4 bg-emerald-950/10 font-semibold text-emerald-300">
                ✓ Instant (Service Worker auto-updates)
              </td>
              <td className="py-3 pl-4 text-slate-400">Users must re-download or update via store</td>
            </tr>
            <tr>
              <td className="py-3 pr-4 font-medium text-white">Offline Capability</td>
              <td className="py-3 px-4 bg-emerald-950/10 font-semibold text-emerald-300">
                ✓ Built-in Service Worker & offline cache
              </td>
              <td className="py-3 pl-4 text-slate-400">Custom Kotlin offline fallback logic</td>
            </tr>
            <tr>
              <td className="py-3 pr-4 font-medium text-white">Installation Friction</td>
              <td className="py-3 px-4 bg-emerald-950/10 font-semibold text-emerald-300">
                ✓ 1-Tap "Add to Home Screen"
              </td>
              <td className="py-3 pl-4 text-slate-400">Sideload warnings ("Install unknown apps")</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 3-Minute Deployment Steps */}
      <div className="space-y-4 pt-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
          <Server className="w-4 h-4 text-indigo-400" />
          <span>How to Deploy Your Downloaded PWA Package in 3 Steps</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
            <span className="w-6 h-6 rounded-md bg-indigo-600/20 text-indigo-400 font-mono text-xs font-bold flex items-center justify-center">
              1
            </span>
            <h4 className="text-xs font-bold text-white">Download the PWA ZIP</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Click <strong className="text-slate-200">Generate PWA Package</strong>. Extract the ZIP containing <code className="text-indigo-400 font-mono">manifest.webmanifest</code>, <code className="text-indigo-400 font-mono">sw.js</code>, <code className="text-indigo-400 font-mono">offline.html</code>, and <code className="text-indigo-400 font-mono">icons/</code>.
            </p>
          </div>

          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
            <span className="w-6 h-6 rounded-md bg-indigo-600/20 text-indigo-400 font-mono text-xs font-bold flex items-center justify-center">
              2
            </span>
            <h4 className="text-xs font-bold text-white">Upload to Website Root</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Drop the files into your web root (e.g., <code className="text-slate-300">public/</code> for Next.js/Vite, <code className="text-slate-300">public_html</code> for cPanel, or theme root for WordPress).
            </p>
          </div>

          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
            <span className="w-6 h-6 rounded-md bg-indigo-600/20 text-indigo-400 font-mono text-xs font-bold flex items-center justify-center">
              3
            </span>
            <h4 className="text-xs font-bold text-white">Paste &lt;head&gt; Snippet</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Add the provided 5-line HTML snippet into your site header. Visitors on Android and iPhone can now immediately tap <strong className="text-slate-200">Add to Home Screen</strong>!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
