import React, { useState, useEffect } from 'react';
import {
  Globe,
  Download,
  Zap,
  Sparkles,
  ArrowRight,
  Code,
  Smartphone,
  Server,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { Header } from './components/Header.tsx';
import { UrlForm } from './components/UrlForm.tsx';
import { DevicePreview } from './components/DevicePreview.tsx';
import { CodeInspector } from './components/CodeInspector.tsx';
import { BuildProgressModal } from './components/BuildProgressModal.tsx';
import { PwaGuide } from './components/PwaGuide.tsx';
import { PwaAuditCard } from './components/PwaAuditCard.tsx';
import { OfflineIndicator } from './components/OfflineIndicator.tsx';
import type { BuildConfig, UrlValidationResult, BuildResult } from './server/types.ts';

const DEFAULT_CONFIG: BuildConfig = {
  url: 'https://example.com',
  appName: 'Example App',
  packageName: 'com.example.app',
  versionName: '1.0.0',
  versionCode: 1,
  primaryColor: '#4F46E5',
  statusBarColor: '#3730A3',
  orientation: 'portrait',
  isFullScreen: false,
  enableJavaScript: true,
  allowFileAccess: true,
  enableDownloadManager: true,
  enableGeolocation: false,
  enableCamera: false,
  allowCleartext: false,
  enablePullToRefresh: true,
  customUserAgentSuffix: 'URL2PWA/1.0',
  splashColor: '#0b0f19',
  splashText: 'Example App',
  enableDeepLinks: true
};

export default function App() {
  const [config, setConfig] = useState<BuildConfig>(DEFAULT_CONFIG);
  const [metadata, setMetadata] = useState<UrlValidationResult | null>(null);
  const [isValidatingUrl, setIsValidatingUrl] = useState(false);
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildResult, setBuildResult] = useState<BuildResult | null>(null);
  const [buildError, setBuildError] = useState<string | null>(null);
  const [isBuildModalOpen, setIsBuildModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('studio');

  // Initial code preview state
  const [livePreviews, setLivePreviews] = useState<Record<string, string>>({});

  // Update live preview code whenever basic properties change
  useEffect(() => {
    const safeShort = (config.appName || 'WebApp').replace(/[^a-zA-Z0-9]/g, '').slice(0, 12) || 'WebApp';
    const sampleManifest = JSON.stringify(
      {
        id: '/',
        name: config.appName,
        short_name: safeShort,
        description: `Official Progressive Web App for ${config.appName}. Installable on mobile and desktop without app store or Android Studio.`,
        start_url: '/',
        scope: '/',
        display: config.isFullScreen ? 'fullscreen' : 'standalone',
        orientation: config.orientation === 'unspecified' ? 'any' : config.orientation,
        background_color: config.splashColor || '#0b0f19',
        theme_color: config.primaryColor || '#4F46E5',
        categories: ['utilities', 'productivity'],
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      null,
      2
    );

    const sampleSw = `// Progressive Web App Service Worker for ${config.appName}
const CACHE_NAME = '${safeShort.toLowerCase()}-pwa-v${config.versionName || '1.0.0'}';
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(['/', '/offline.html', '/manifest.webmanifest']);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((k) => k !== CACHE_NAME && caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        return (await cache.match(OFFLINE_URL)) || new Response('Offline');
      })
    );
  }
});`;

    const sampleSnippet = `<!-- PWA Meta Tags for ${config.appName} -->
<meta name="theme-color" content="${config.primaryColor || '#4F46E5'}">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">

<!-- Service Worker Registration -->
<script>
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js');
  }
</script>`;

    setLivePreviews({
      'manifest.webmanifest': sampleManifest,
      'sw.js': sampleSw,
      'pwa-head-snippet.html': sampleSnippet,
      'README-PWA.md': `# ${config.appName} - Progressive Web App\n\nInstalls directly in browser with Zero Android Studio required!`
    });
  }, [config]);

  // Handle URL Inspection & Metadata Fetch
  const handleValidateUrl = async (overrideUrl?: string) => {
    const urlToTest = overrideUrl || config.url;
    if (!urlToTest) return;

    setIsValidatingUrl(true);
    try {
      const res = await fetch('/api/validate-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToTest })
      });
      const data: UrlValidationResult = await res.json();
      setMetadata(data);

      if (data.valid) {
        setConfig((prev) => ({
          ...prev,
          url: data.normalizedUrl || prev.url,
          appName: data.suggestedAppName || prev.appName,
          packageName: data.suggestedPackageName || prev.packageName,
          splashText: data.suggestedAppName || prev.splashText,
          allowCleartext: !data.hasSsl
        }));
      }
    } catch (err: any) {
      console.error('Validation error:', err);
    } finally {
      setIsValidatingUrl(false);
    }
  };

  // Handle custom image upload
  const handleIconUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setConfig((prev) => ({
          ...prev,
          iconBase64: reader.result as string
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle use fetched favicon
  const handleUseFetchedIcon = () => {
    if (metadata?.faviconUrl) {
      setConfig((prev) => ({
        ...prev,
        iconBase64: ''
      }));
    }
  };

  // Build Handler
  const handleBuild = async () => {
    setIsBuilding(true);
    setBuildError(null);
    setIsBuildModalOpen(true);

    try {
      const res = await fetch('/api/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      const data: BuildResult = await res.json();
      if (!res.ok || !data.success) {
        throw new Error((data as any).error || 'PWA synthesis failed.');
      }

      setBuildResult(data);
      if (data.filePreviews) {
        setLivePreviews(data.filePreviews);
      }
    } catch (err: any) {
      setBuildError(err.message || 'An error occurred during build.');
    } finally {
      setIsBuilding(false);
    }
  };

  // Section navigation
  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans">
      {/* Offline Status Badge */}
      <OfflineIndicator />

      {/* Top Navigation Bar with In-App PWA Install Trigger */}
      <Header
        onBuildClick={handleBuild}
        isBuilding={isBuilding}
        onNavigate={scrollToSection}
        activeSection={activeSection}
      />

      {/* Main Studio Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-12">
        {/* Editorial Hero Kicker */}
        <section id="studio" className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-800/80 pb-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                <span className="flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" /> Zero Android Studio Required
                </span>
                <span aria-hidden="true">·</span>
                <span>Universal iOS & Android</span>
                <span aria-hidden="true">·</span>
                <span>W3C Compliant Manifest</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white" style={{ textWrap: 'balance' }}>
                Turn Any Website into an Installable Progressive Web App
              </h1>
              <p className="text-sm text-slate-400 leading-relaxed">
                Generate a complete, turnkey PWA package with a Web App Manifest, Service Worker, and branded offline engine. Users install directly from Chrome or Safari onto their home screen without opening Android Studio or paying app store fees.
              </p>
            </div>

            {/* Quick KPI / Spec Indicator Strip */}
            <div className="flex items-center gap-3 p-3 bg-slate-900/70 border border-slate-800 rounded-xl text-xs shrink-0 font-mono">
              <div className="text-center px-3 border-r border-slate-800">
                <span className="block text-slate-500 text-[10px]">PLATFORMS</span>
                <span className="font-bold text-white">iOS + Android</span>
              </div>
              <div className="text-center px-3 border-r border-slate-800">
                <span className="block text-slate-500 text-[10px]">INSTALLATION</span>
                <span className="font-bold text-emerald-400">1-Tap Browser</span>
              </div>
              <div className="text-center px-3">
                <span className="block text-slate-500 text-[10px]">TOOLCHAIN</span>
                <span className="font-bold text-indigo-400">0 GB Setup</span>
              </div>
            </div>
          </div>

          {/* Studio Split Grid: Configuration Studio + Live Device Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-2">
            {/* Left 7 Columns: Configuration Studio */}
            <div className="lg:col-span-7 space-y-6">
              <UrlForm
                config={config}
                onChange={(updates) => setConfig((prev) => ({ ...prev, ...updates }))}
                metadata={metadata}
                isValidatingUrl={isValidatingUrl}
                onValidateUrl={handleValidateUrl}
                onIconUpload={handleIconUpload}
                onUseFetchedIcon={handleUseFetchedIcon}
              />

              {/* Action Banner */}
              <div className="p-5 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-900/50 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5 justify-center sm:justify-start">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>Ready to generate your Progressive Web App?</span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    Creates <code className="text-emerald-400">manifest.webmanifest</code>, <code className="text-emerald-400">sw.js</code>, offline page, and responsive icons.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleBuild}
                  disabled={isBuilding}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/25 transition-all whitespace-nowrap shrink-0 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>{isBuilding ? 'Assembling…' : 'Generate PWA Package'}</span>
                </button>
              </div>

              {/* Mobile Readiness & Quality Checklist */}
              <PwaAuditCard metadata={metadata} url={config.url} />
            </div>

            {/* Right 5 Columns: Interactive Device Preview */}
            <div id="preview" className="lg:col-span-5 flex flex-col items-center">
              <div className="sticky top-20 w-full flex flex-col items-center">
                <div className="w-full flex items-center justify-between mb-3 px-1 text-xs text-slate-400">
                  <span className="font-semibold text-slate-300">Live PWA Device Preview</span>
                  <span>Standalone Mobile Frame</span>
                </div>
                <DevicePreview config={config} metadata={metadata} />
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Code Inspector (Manifest & Service Worker) */}
        <section id="code" className="space-y-4 pt-6 border-t border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Code className="w-5 h-5 text-emerald-400" />
                <span>PWA Source Code & Manifest Inspector</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Inspect your generated Web App Manifest, Service Worker, and copy-paste head snippet.
              </p>
            </div>

            {buildResult && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-2.5 py-1 rounded-md">
                  PWA Ready · {buildResult.files.length} Assets
                </span>
              </div>
            )}
          </div>

          <CodeInspector
            files={buildResult?.filePreviews || livePreviews}
            pwaZipUrl={buildResult?.pwaDownloadUrl}
            zipUrl={buildResult?.zipDownloadUrl}
            apkUrl={buildResult?.apkDownloadUrl}
          />
        </section>

        {/* Section 3: PWA vs APK Comparison Guide */}
        <section id="guide" className="pt-6 border-t border-slate-800">
          <PwaGuide />
        </section>

        {/* Section 4: 3-Minute Deployment Guide */}
        <section id="deploy" className="pt-6 border-t border-slate-800 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-indigo-400" />
              <span>Universal Web Host Deployment Instructions</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Instructions for deploying the PWA package to any static host, WordPress, Shopify, Next.js, or standard server.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Next.js / Vite / React</span>
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Extract the PWA ZIP directly into your project's <code className="text-indigo-400 font-mono">public/</code> folder. Framework bundlers automatically serve them at the root URL.
              </p>
            </div>

            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>WordPress & WooCommerce</span>
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Upload files to your server root via FTP/cPanel, and paste the head snippet into your active theme's <code className="text-indigo-400 font-mono">header.php</code> or via a header injection plugin.
              </p>
            </div>

            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Vercel / Netlify / Cloudflare</span>
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Include the files in your build output folder. Set MIME type header <code className="text-indigo-400 font-mono">application/manifest+json</code> for <code className="text-slate-300">manifest.webmanifest</code>.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Clean Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 py-6 px-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">URL2PWA Studio</span>
            <span aria-hidden="true">·</span>
            <span>Progressive Web App Engine</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-400 font-medium">Zero Android Studio</span>
          </div>

          <p className="text-center sm:text-right text-[11px] text-slate-500">
            Complies with W3C Web App Manifest and Service Worker standards. Works across Chromium, WebKit, and Gecko engines.
          </p>
        </div>
      </footer>

      {/* Modal for PWA Build Progress & Downloads */}
      <BuildProgressModal
        isOpen={isBuildModalOpen}
        onClose={() => setIsBuildModalOpen(false)}
        isBuilding={isBuilding}
        buildResult={buildResult}
        error={buildError}
        onOpenCodeInspector={() => scrollToSection('code')}
      />
    </div>
  );
}
