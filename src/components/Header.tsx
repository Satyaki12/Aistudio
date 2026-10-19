import React from 'react';
import { Globe, Download, Sparkles, Smartphone } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton.tsx';

interface HeaderProps {
  onBuildClick: () => void;
  isBuilding: boolean;
  onNavigate: (sectionId: string) => void;
  activeSection: string;
}

export const Header: React.FC<HeaderProps> = ({
  onBuildClick,
  isBuilding,
  onNavigate,
  activeSection
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#0b0f19]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-6 py-3.5">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#studio"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('studio');
          }}
          className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 hover:text-indigo-400 transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20">
            <Globe className="w-4 h-4" />
          </div>
          <span>URL2PWA</span>
        </a>

        {/* Zone 2: Concise single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
          <button
            onClick={() => onNavigate('studio')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              activeSection === 'studio' ? 'text-white' : 'hover:text-slate-200'
            }`}
          >
            PWA Studio
          </button>
          <button
            onClick={() => onNavigate('preview')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              activeSection === 'preview' ? 'text-white' : 'hover:text-slate-200'
            }`}
          >
            Live Preview
          </button>
          <button
            onClick={() => onNavigate('code')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              activeSection === 'code' ? 'text-white' : 'hover:text-slate-200'
            }`}
          >
            Manifest & Code
          </button>
          <button
            onClick={() => onNavigate('guide')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              activeSection === 'guide' ? 'text-white' : 'hover:text-slate-200'
            }`}
          >
            PWA vs APK Guide
          </button>
          <button
            onClick={() => onNavigate('deploy')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              activeSection === 'deploy' ? 'text-white' : 'hover:text-slate-200'
            }`}
          >
            Deployment
          </button>
        </nav>

        {/* Zone 3: 1 primary action + PWA Install button */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* In-App PWA Install Button */}
          <PWAInstallButton />

          <button
            type="button"
            onClick={onBuildClick}
            disabled={isBuilding}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-indigo-600/30 whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isBuilding ? 'Generating PWA…' : 'Generate PWA Package'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
