import React, { useState } from 'react';
import {
  Globe,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Upload,
  Palette,
  Shield,
  Layers,
  RefreshCw,
  Zap,
  Smartphone,
  WifiOff
} from 'lucide-react';
import type { BuildConfig, UrlValidationResult } from '../server/types.ts';

interface UrlFormProps {
  config: BuildConfig;
  onChange: (updated: Partial<BuildConfig>) => void;
  metadata: UrlValidationResult | null;
  isValidatingUrl: boolean;
  onValidateUrl: (urlToTest?: string) => void;
  onIconUpload: (file: File) => void;
  onUseFetchedIcon: () => void;
}

const COLOR_SWATCHES = [
  { primary: '#4F46E5', status: '#3730A3', label: 'Indigo' },
  { primary: '#2563EB', status: '#1E40AF', label: 'Blue' },
  { primary: '#0D9488', status: '#115E59', label: 'Teal' },
  { primary: '#059669', status: '#065F46', label: 'Emerald' },
  { primary: '#D97706', status: '#92400E', label: 'Amber' },
  { primary: '#DC2626', status: '#991B1B', label: 'Rose' },
  { primary: '#9333EA', status: '#6B21A8', label: 'Purple' },
  { primary: '#0F172A', status: '#020617', label: 'Midnight' }
];

export const UrlForm: React.FC<UrlFormProps> = ({
  config,
  onChange,
  metadata,
  isValidatingUrl,
  onValidateUrl,
  onIconUpload,
  onUseFetchedIcon
}) => {
  const [activeTab, setActiveTab] = useState<'basics' | 'appearance' | 'offline' | 'display'>('basics');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onIconUpload(e.target.files[0]);
    }
  };

  const shortName = config.appName.replace(/[^a-zA-Z0-9 ]/g, '').slice(0, 12);

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* Zero Android Studio Banner */}
      <div className="bg-indigo-950/40 border-b border-indigo-900/60 px-5 py-2.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-indigo-300">
          <Zap className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="font-semibold">Zero Android Studio Required</span>
          <span className="text-indigo-400/60">·</span>
          <span className="text-indigo-300/80">Installs on Android, iOS, Windows, and Mac directly via browser</span>
        </div>
        <span className="font-mono text-[11px] text-emerald-400 font-medium hidden sm:inline">100% Web Native</span>
      </div>

      {/* Tab Bar / Segmented Controls */}
      <div className="flex border-b border-slate-800 bg-slate-900/60 p-1.5 gap-1 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('basics')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'basics'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Globe className="w-3.5 h-3.5 text-indigo-400" />
          <span>Website URL & Title</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('appearance')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'appearance'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Palette className="w-3.5 h-3.5 text-indigo-400" />
          <span>Icons & Theme Colors</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('display')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'display'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
          <span>Display & Window</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('offline')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'offline'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <WifiOff className="w-3.5 h-3.5 text-indigo-400" />
          <span>Service Worker & Offline</span>
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Tab 1: Basics (URL, App Name, Short Name) */}
        {activeTab === 'basics' && (
          <div className="space-y-5">
            {/* Website URL Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Website URL <span className="text-rose-400">*</span>
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Globe className="w-4 h-4" />
                  </div>
                  <input
                    type="url"
                    value={config.url}
                    onChange={(e) => onChange({ url: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        onValidateUrl();
                      }
                    }}
                    placeholder="https://yourwebsite.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => onValidateUrl()}
                  disabled={isValidatingUrl || !config.url}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-xs font-medium text-slate-200 rounded-lg border border-slate-700 transition-colors whitespace-nowrap shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isValidatingUrl ? 'animate-spin' : ''}`} />
                  <span>{isValidatingUrl ? 'Inspecting…' : 'Inspect Site'}</span>
                </button>
              </div>

              {/* URL Inspection Badges */}
              {metadata && (
                <div className="mt-3 p-3 bg-slate-900/80 border border-slate-800 rounded-lg text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {metadata.hasSsl ? (
                        <span className="flex items-center gap-1 text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" /> HTTPS Validated (Required for PWA)
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-amber-400 font-medium">
                          <AlertCircle className="w-3.5 h-3.5" /> HTTP Detected. PWAs require HTTPS to install.
                        </span>
                      )}
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-400 font-mono">{metadata.domain}</span>
                    </div>

                    {metadata.pwaReady ? (
                      <span className="text-indigo-400 font-medium">Existing Manifest Detected</span>
                    ) : (
                      <span className="text-slate-400">Ready for PWA injection</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* App Name and Short Name Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Full Application Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={config.appName}
                  onChange={(e) => onChange({ appName: e.target.value })}
                  placeholder="My Store"
                  maxLength={45}
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
                <span className="block text-[11px] text-slate-400 mt-1">
                  Used in app store banners, install dialogs, and window titles.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Short Name (Home Screen Label)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={shortName}
                    readOnly
                    className="w-full px-3 py-2.5 bg-slate-900/60 border border-slate-800 rounded-lg text-sm font-mono text-indigo-300"
                  />
                  <span className="absolute right-3 top-2.5 text-[11px] font-mono text-slate-500">
                    {shortName.length}/12 chars
                  </span>
                </div>
                <span className="block text-[11px] text-slate-400 mt-1">
                  Limited to ≤12 characters to prevent truncation beneath mobile icons.
                </span>
              </div>
            </div>

            {/* Versioning & Start URL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  PWA Scope & Start URL
                </label>
                <input
                  type="text"
                  value="/"
                  readOnly
                  className="w-full px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-lg text-xs font-mono text-slate-400"
                />
                <span className="block text-[11px] text-slate-500 mt-1">
                  Defines the root navigation boundary of your installable web app.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  PWA Version
                </label>
                <input
                  type="text"
                  value={config.versionName}
                  onChange={(e) => onChange({ versionName: e.target.value })}
                  placeholder="1.0.0"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="block text-[11px] text-slate-500 mt-1">
                  Bumping this version automatically refreshes the Service Worker cache.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Appearance & Icons */}
        {activeTab === 'appearance' && (
          <div className="space-y-6">
            {/* Color Pickers & Presets */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
                Theme & Splash Colors
              </label>

              {/* Quick Swatches */}
              <div className="flex flex-wrap gap-2 mb-4">
                {COLOR_SWATCHES.map((swatch) => (
                  <button
                    key={swatch.label}
                    type="button"
                    onClick={() =>
                      onChange({
                        primaryColor: swatch.primary,
                        statusBarColor: swatch.status
                      })
                    }
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
                  >
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: swatch.primary }}
                    />
                    <span className="text-slate-300">{swatch.label}</span>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-300 font-medium">Theme Color (Status Bar)</span>
                    <span className="text-xs font-mono text-slate-400">{config.primaryColor}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={config.primaryColor}
                      onChange={(e) => onChange({ primaryColor: e.target.value })}
                      className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent"
                    />
                    <input
                      type="text"
                      value={config.primaryColor}
                      onChange={(e) => onChange({ primaryColor: e.target.value })}
                      className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs font-mono text-white"
                    />
                  </div>
                </div>

                <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-300 font-medium">Splash Background Color</span>
                    <span className="text-xs font-mono text-slate-400">{config.splashColor}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={config.splashColor}
                      onChange={(e) => onChange({ splashColor: e.target.value })}
                      className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent"
                    />
                    <input
                      type="text"
                      value={config.splashColor}
                      onChange={(e) => onChange({ splashColor: e.target.value })}
                      className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs font-mono text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* PWA Icon Asset Upload & Favicon Grabber */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                PWA Application Icons
              </label>

              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-slate-900/60 border border-slate-800 rounded-lg">
                <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-700 shadow-inner shrink-0">
                  {config.iconBase64 ? (
                    <img
                      src={config.iconBase64}
                      alt="PWA Icon"
                      className="w-full h-full object-cover"
                    />
                  ) : metadata?.faviconUrl ? (
                    <img
                      src={metadata.faviconUrl}
                      alt="Fetched Icon"
                      className="w-10 h-10 object-contain"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <span className="text-2xl font-bold text-indigo-400">
                      {config.appName.charAt(0) || 'A'}
                    </span>
                  )}
                </div>

                <div className="flex-1 space-y-2 text-center sm:text-left">
                  <p className="text-xs text-slate-300 font-medium">
                    Auto-generates <code className="text-indigo-400 font-mono">192×192</code>, <code className="text-indigo-400 font-mono">512×512</code>, and Android maskable icons.
                  </p>
                  <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Custom PNG</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>

                    {metadata?.faviconUrl && (
                      <button
                        type="button"
                        onClick={onUseFetchedIcon}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Use Site Favicon</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Display Mode & Orientation */}
        {activeTab === 'display' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Display Window Mode
                </label>
                <div className="space-y-2">
                  <label className="flex items-start gap-2.5 p-3 bg-slate-900/60 border border-slate-800 rounded-lg cursor-pointer hover:border-slate-700">
                    <input
                      type="radio"
                      name="displayMode"
                      checked={!config.isFullScreen}
                      onChange={() => onChange({ isFullScreen: false })}
                      className="mt-0.5 text-indigo-600"
                    />
                    <div>
                      <span className="text-xs font-semibold text-slate-200 block">Standalone (Recommended)</span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        Hides browser address bar; looks and feels like a native Android/iOS application.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-3 bg-slate-900/60 border border-slate-800 rounded-lg cursor-pointer hover:border-slate-700">
                    <input
                      type="radio"
                      name="displayMode"
                      checked={config.isFullScreen}
                      onChange={() => onChange({ isFullScreen: true })}
                      className="mt-0.5 text-indigo-600"
                    />
                    <div>
                      <span className="text-xs font-semibold text-slate-200 block">Fullscreen</span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        Hides system status bar completely (ideal for games and media players).
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Orientation Preference
                </label>
                <select
                  value={config.orientation}
                  onChange={(e) => onChange({ orientation: e.target.value as any })}
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="portrait">Portrait Lock (Standard Mobile)</option>
                  <option value="landscape">Landscape Lock</option>
                  <option value="unspecified">Any (Follow Device Sensor)</option>
                </select>
                <span className="block text-[11px] text-slate-400 mt-2 leading-relaxed">
                  Recorded in <code className="text-indigo-400 font-mono">manifest.webmanifest</code> to ensure proper launch rotation.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Service Worker & Offline */}
        {activeTab === 'offline' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">
              The generated Service Worker provides automatic background caching and offline reliability.
            </p>

            <div className="space-y-3">
              <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-lg flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">Stale-While-Revalidate Static Caching</span>
                  <span className="text-[11px] text-slate-400 block mt-0.5 leading-relaxed">
                    Instantly serves images, styles, and scripts from cache while refreshing them in the background.
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-lg flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">Branded Standalone Offline Page (<code className="text-indigo-400 font-mono">offline.html</code>)</span>
                  <span className="text-[11px] text-slate-400 block mt-0.5 leading-relaxed">
                    Provides a custom offline experience with automatic auto-reconnect detection when signal returns.
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-lg flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">Cache Purge on Version Updates</span>
                  <span className="text-[11px] text-slate-400 block mt-0.5 leading-relaxed">
                    Old caches are automatically flushed when you bump the version name, ensuring visitors always see your latest site.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
