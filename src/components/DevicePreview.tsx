import React, { useState } from 'react';
import {
  Smartphone,
  Wifi,
  Battery,
  Lock,
  Sparkles,
  ArrowLeft,
  Circle,
  Square,
  RefreshCw,
  Plus,
  Check,
  Download
} from 'lucide-react';
import type { BuildConfig, UrlValidationResult } from '../server/types.ts';

interface DevicePreviewProps {
  config: BuildConfig;
  metadata: UrlValidationResult | null;
}

export const DevicePreview: React.FC<DevicePreviewProps> = ({ config, metadata }) => {
  const [viewMode, setViewMode] = useState<'home' | 'app'>('home');
  const [iconShape, setIconShape] = useState<'squircle' | 'circle' | 'rounded'>('squircle');
  const [showInstallBanner, setShowInstallBanner] = useState(true);
  const [isSimulatingOffline, setIsSimulatingOffline] = useState(false);

  const getShapeClass = () => {
    switch (iconShape) {
      case 'circle':
        return 'rounded-full';
      case 'rounded':
        return 'rounded-xl';
      case 'squircle':
      default:
        return 'rounded-[22%]';
    }
  };

  const shortName = config.appName.replace(/[^a-zA-Z0-9 ]/g, '').slice(0, 12);

  return (
    <div className="flex flex-col items-center">
      {/* View Switcher Controls */}
      <div className="w-full max-w-[340px] flex items-center justify-between gap-2 mb-4 bg-slate-900 p-1 rounded-xl border border-slate-800">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setViewMode('home')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              viewMode === 'home'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Home Screen
          </button>
          <button
            type="button"
            onClick={() => setViewMode('app')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              viewMode === 'app'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Standalone PWA
          </button>
        </div>

        {viewMode === 'app' ? (
          <button
            type="button"
            onClick={() => setIsSimulatingOffline(!isSimulatingOffline)}
            className={`flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded border transition-colors whitespace-nowrap shrink-0 ${
              isSimulatingOffline
                ? 'bg-amber-950/80 text-amber-300 border-amber-700/80'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            <span>{isSimulatingOffline ? 'Signal Lost' : 'Test Offline'}</span>
          </button>
        ) : (
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-500 mr-1">Mask:</span>
            <button
              onClick={() => setIconShape('squircle')}
              title="Squircle"
              className={`p-1 rounded text-xs ${iconShape === 'squircle' ? 'text-indigo-400 bg-slate-800' : 'text-slate-500'}`}
            >
              ■
            </button>
            <button
              onClick={() => setIconShape('circle')}
              title="Circle"
              className={`p-1 rounded text-xs ${iconShape === 'circle' ? 'text-indigo-400 bg-slate-800' : 'text-slate-500'}`}
            >
              ●
            </button>
          </div>
        )}
      </div>

      {/* Android Device Frame */}
      <div className="relative w-[340px] h-[680px] bg-slate-950 rounded-[44px] p-3 shadow-2xl border-4 border-slate-700/80 ring-1 ring-slate-800 flex flex-col overflow-hidden select-none">
        {/* Device Speaker / Camera Punch-hole */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-4 bg-black rounded-full z-30 flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800" />
        </div>

        {/* Inner Screen Canvas */}
        <div className="relative flex-1 rounded-[34px] overflow-hidden flex flex-col bg-slate-900 border border-slate-800/80">
          {/* Status Bar */}
          <div
            className="h-7 px-6 flex items-center justify-between text-[11px] font-medium z-20 transition-colors"
            style={{
              backgroundColor: viewMode === 'app' && !config.isFullScreen ? config.primaryColor : 'transparent',
              color: '#ffffff'
            }}
          >
            <span className="font-mono tabular-nums">09:41</span>
            <div className="flex items-center gap-2">
              <Wifi className="w-3 h-3" />
              <Battery className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* VIEW MODE 1: HOME SCREEN LAUNCHER */}
          {viewMode === 'home' && (
            <div className="relative flex-1 flex flex-col justify-between p-4 bg-gradient-to-b from-slate-900 via-indigo-950/40 to-slate-950">
              {/* PWA Home Screen Grid */}
              <div className="relative z-10 pt-8">
                {/* Search Bar Widget */}
                <div className="w-full bg-slate-800/70 backdrop-blur-md rounded-full px-4 py-2 flex items-center justify-between text-xs text-slate-400 mb-8 border border-slate-700/50">
                  <span className="text-slate-400 font-medium">Search web or apps</span>
                  <div className="w-2 h-2 rounded-full bg-indigo-500" />
                </div>

                {/* App Icons Row */}
                <div className="grid grid-cols-4 gap-4 text-center">
                  {/* The User's Installed PWA App */}
                  <div
                    onClick={() => setViewMode('app')}
                    className="flex flex-col items-center gap-1.5 cursor-pointer group"
                  >
                    <div
                      className={`relative w-14 h-14 ${getShapeClass()} shadow-lg flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105 active:scale-95 ring-2 ring-indigo-400/50`}
                      style={{ backgroundColor: config.primaryColor }}
                    >
                      {config.iconBase64 ? (
                        <img
                          src={config.iconBase64}
                          alt={config.appName}
                          className="w-full h-full object-cover"
                        />
                      ) : metadata?.faviconUrl ? (
                        <img
                          src={metadata.faviconUrl}
                          alt={config.appName}
                          className="w-8 h-8 object-contain"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className="text-white text-xl font-bold">
                          {config.appName.charAt(0) || 'A'}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-medium text-white truncate max-w-[64px] drop-shadow-md">
                      {shortName || 'My App'}
                    </span>
                  </div>

                  {/* Standard System Icons */}
                  <div className="flex flex-col items-center gap-1.5 opacity-60">
                    <div className="w-14 h-14 rounded-[22%] bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                      Chrome
                    </div>
                    <span className="text-[11px] text-slate-300">Chrome</span>
                  </div>

                  <div className="flex flex-col items-center gap-1.5 opacity-60">
                    <div className="w-14 h-14 rounded-[22%] bg-emerald-600 flex items-center justify-center text-white text-xs font-bold">
                      Maps
                    </div>
                    <span className="text-[11px] text-slate-300">Maps</span>
                  </div>

                  <div className="flex flex-col items-center gap-1.5 opacity-60">
                    <div className="w-14 h-14 rounded-[22%] bg-slate-700 flex items-center justify-center text-white text-xs font-bold">
                      Settings
                    </div>
                    <span className="text-[11px] text-slate-300">Settings</span>
                  </div>
                </div>
              </div>

              {/* Bottom Dock */}
              <div className="relative z-10 bg-slate-800/40 backdrop-blur-md rounded-3xl p-3 border border-slate-700/30 flex items-center justify-around mb-2">
                <div className="w-11 h-11 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold">
                  📞
                </div>
                <div className="w-11 h-11 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                  💬
                </div>
                <div className="w-11 h-11 rounded-full bg-amber-600 flex items-center justify-center text-white text-xs font-bold">
                  📷
                </div>
                <div
                  onClick={() => setViewMode('app')}
                  className="w-11 h-11 rounded-full flex items-center justify-center cursor-pointer shadow-md"
                  style={{ backgroundColor: config.primaryColor }}
                >
                  <span className="text-white text-xs font-bold">
                    {config.appName.charAt(0) || 'A'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* VIEW MODE 2: STANDALONE PWA (Zero browser URL bar) */}
          {viewMode === 'app' && (
            <div className="relative flex-1 flex flex-col bg-slate-950 overflow-hidden">
              {/* Standalone Window Title Bar */}
              <div
                className="px-4 py-2 flex items-center justify-between text-xs text-white"
                style={{ backgroundColor: config.primaryColor }}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2 h-2 rounded-full bg-emerald-300" />
                  <span className="font-semibold truncate">{config.appName || 'My Store'}</span>
                </div>
                <span className="text-[10px] font-mono opacity-80">PWA Standalone</span>
              </div>

              {/* Main Content Area */}
              <div className="relative flex-1 flex flex-col justify-between overflow-hidden bg-slate-900 p-5">
                {isSimulatingOffline ? (
                  /* Offline Fallback Simulation */
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                    <div
                      className="w-14 h-14 rounded-2xl mb-3 flex items-center justify-center text-white text-xl font-bold shadow-lg"
                      style={{ backgroundColor: config.primaryColor }}
                    >
                      {config.appName.charAt(0) || 'A'}
                    </div>
                    <h4 className="text-sm font-bold text-white mb-1">You are currently offline</h4>
                    <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                      Service Worker detected no internet. Displaying cached offline fallback.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsSimulatingOffline(false)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold"
                    >
                      Restore Connection
                    </button>
                  </div>
                ) : (
                  /* Live PWA App Canvas */
                  <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <div
                      className="w-14 h-14 rounded-2xl mb-3 flex items-center justify-center text-white text-xl font-bold shadow-lg"
                      style={{ backgroundColor: config.primaryColor }}
                    >
                      {config.iconBase64 ? (
                        <img src={config.iconBase64} alt="" className="w-full h-full object-cover rounded-2xl" />
                      ) : (
                        config.appName.charAt(0) || 'A'
                      )}
                    </div>
                    <h3 className="text-base font-bold text-white mb-1">{config.appName}</h3>
                    <p className="text-xs text-slate-400 font-mono mb-4 break-all max-w-[240px]">
                      {config.url || 'https://yourwebsite.com'}
                    </p>

                    <div className="w-full max-w-[240px] bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-[11px] space-y-1.5 text-left">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Display:</span>
                        <span className="font-mono text-emerald-400">Standalone (No URL Bar)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Service Worker:</span>
                        <span className="font-mono text-emerald-400">Active & Caching</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Android Studio:</span>
                        <span className="font-mono text-indigo-400 font-semibold">Not Needed</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Simulated In-Browser PWA Install Banner */}
                {showInstallBanner && (
                  <div className="bg-slate-800/95 border border-indigo-500/40 rounded-xl p-3 shadow-xl backdrop-blur-md flex items-center justify-between gap-3 animate-in fade-in">
                    <div className="flex items-center gap-2 truncate">
                      <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                        {config.appName.charAt(0) || 'A'}
                      </div>
                      <div className="truncate">
                        <span className="text-xs font-bold text-white block truncate">Add {shortName} to Home Screen</span>
                        <span className="text-[10px] text-slate-400 block">Instant mobile install</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowInstallBanner(false)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 whitespace-nowrap shrink-0"
                    >
                      Install
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Android Navigation Bar */}
          <div className="h-9 bg-black flex items-center justify-around text-slate-400 z-20 border-t border-slate-900">
            <button
              type="button"
              onClick={() => setViewMode('home')}
              title="Back"
              className="p-1 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('home')}
              title="Home"
              className="p-1 hover:text-white transition-colors"
            >
              <Circle className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Recents"
              className="p-1 hover:text-white transition-colors"
            >
              <Square className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
