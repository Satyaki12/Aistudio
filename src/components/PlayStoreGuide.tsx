import React from 'react';
import {
  ShieldAlert,
  Key,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Lock,
  Cpu,
  Layers
} from 'lucide-react';

export const PlayStoreGuide: React.FC = () => {
  return (
    <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-400" />
          <span>Google Play Store & Production Deployment Architecture</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Essential guidelines on Google Play policies, signing keys, and architectural differences between WebView and TWA.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1: WebView vs TWA */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-400" />
            <span>WebView Wrapper vs. Trusted Web Activity (TWA)</span>
          </h3>
          <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-lg text-xs space-y-2 text-slate-300 leading-relaxed">
            <p>
              <strong className="text-white">AndroidX WebView (This App):</strong> Runs an isolated browser engine inside your application. You maintain full control over hardware back presses, custom status bar colors, splash screens, download listeners, and custom JavaScript interfaces.
            </p>
            <p>
              <strong className="text-white">Trusted Web Activity (TWA):</strong> Shares the user's Chrome browser instance (including saved cookies and Google auto-fill). Requires Digital Asset Links (<code className="text-indigo-400">assetlinks.json</code>) hosted on your server root.
            </p>
            <div className="p-2.5 bg-indigo-950/40 border border-indigo-900/60 rounded text-[11px] text-indigo-200">
              💡 <em>Recommendation:</em> For websites with bespoke navigation, custom branding, and specialized file downloads, an AndroidX WebView wrapper offers maximum control and zero domain verification hurdles.
            </div>
          </div>
        </div>

        {/* Section 2: Play Store Policy Compliance */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Google Play Policy & Minimum Functionality</span>
          </h3>
          <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-lg text-xs space-y-2 text-slate-300 leading-relaxed">
            <p>
              <strong className="text-white">Ownership & Webview Spam Policy:</strong> Google Play requires that you own or have explicit licensing for the wrapped website. Do not wrap sites you do not own (e.g. Amazon, Wikipedia) as they will be rejected under the "Webview Spam" policy.
            </p>
            <p>
              <strong className="text-white">Offline Experience:</strong> The generated project includes an automatic network reachability prober and offline retry screen to prevent white-screen crashes when users have no signal.
            </p>
            <p>
              <strong className="text-white">Target SDK:</strong> Google Play requires targetSdk 34+ (Android 14+). URL2APK is configured with <strong className="text-emerald-400">targetSdk 35</strong> (Android 15) out of the box!
            </p>
          </div>
        </div>

        {/* Section 3: Keystore & Signing */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Key className="w-4 h-4 text-emerald-400" />
            <span>Generating a Production Keystore</span>
          </h3>
          <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-lg text-xs space-y-3 text-slate-300">
            <p className="text-[11px] leading-relaxed">
              Debug APKs are signed with a generic debug certificate. For Google Play, generate an official PKCS12 production keystore using the standard JDK <code className="text-indigo-400 font-mono">keytool</code>:
            </p>
            <pre className="p-2.5 bg-[#070b13] rounded font-mono text-[11px] text-slate-300 overflow-x-auto select-all border border-slate-800">
              keytool -genkeypair -v -storetype PKCS12 -keystore release.p12 -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
            </pre>
            <p className="text-[11px] text-slate-400">
              Store this keystore in a safe location. Once an app is published to Google Play, the signing certificate cannot be changed unless Play App Signing is configured.
            </p>
          </div>
        </div>

        {/* Section 4: Package Uniqueness & Bot Walls */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Lock className="w-4 h-4 text-rose-400" />
            <span>Package Uniqueness & Cloudflare / Bot Walls</span>
          </h3>
          <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-lg text-xs space-y-2 text-slate-300 leading-relaxed">
            <p>
              <strong className="text-white">Unique Package Identifier:</strong> Package names (e.g. <code className="text-indigo-400">com.brand.app</code>) are globally unique on Google Play. You cannot use a package name that another app is already using.
            </p>
            <p>
              <strong className="text-white">Cloudflare & Bot Protection:</strong> Sites protected by strict Cloudflare Captchas or Turnstile may occasionally challenge WebView traffic if the User-Agent is recognized as generic. We provide a customizable User-Agent suffix so you can identify your official mobile app.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
