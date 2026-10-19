import React, { useState } from 'react';
import { Copy, Check, FileCode, Download, Zap } from 'lucide-react';

interface CodeInspectorProps {
  files: Record<string, string>;
  pwaZipUrl?: string;
  zipUrl?: string;
  apkUrl?: string;
}

export const CodeInspector: React.FC<CodeInspectorProps> = ({
  files,
  pwaZipUrl,
  zipUrl,
  apkUrl
}) => {
  const fileKeys = Object.keys(files);
  const [selectedFile, setSelectedFile] = useState<string>(fileKeys[0] || 'manifest.webmanifest');
  const [copied, setCopied] = useState(false);

  // If selectedFile is not in keys (e.g. on new build), default to first available
  const activeFile = files[selectedFile] ? selectedFile : (fileKeys[0] || '');
  const currentContent = files[activeFile] || '';

  const handleCopy = () => {
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#0f172a] border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col">
      {/* Top Header & File Navigation */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b border-slate-800 bg-slate-900/80 px-4 py-2.5 gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
          {fileKeys.map((filename) => {
            const isPwaFile = filename.includes('manifest') || filename.includes('sw.js') || filename.includes('offline') || filename.includes('snippet') || filename.includes('PWA');
            return (
              <button
                key={filename}
                onClick={() => setSelectedFile(filename)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  activeFile === filename
                    ? isPwaFile
                      ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 shadow-sm'
                      : 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <FileCode className={`w-3.5 h-3.5 ${isPwaFile ? 'text-emerald-400' : 'text-indigo-400'}`} />
                <span>{filename}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          {pwaZipUrl && (
            <a
              href={pwaZipUrl}
              download
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors whitespace-nowrap shadow-sm shadow-emerald-600/20"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PWA Package (ZIP)</span>
            </a>
          )}

          {zipUrl && (
            <a
              href={zipUrl}
              download
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>Android Source (Optional)</span>
            </a>
          )}

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors whitespace-nowrap"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Display with Line Numbers */}
      <div className="relative flex-1 max-h-[540px] overflow-auto bg-[#070b13] p-4 font-mono text-xs text-slate-300 leading-relaxed">
        <pre className="flex">
          <div className="select-none text-slate-600 pr-4 text-right border-r border-slate-800 mr-4 font-mono tabular-nums">
            {currentContent.split('\n').map((_, index) => (
              <div key={index}>{index + 1}</div>
            ))}
          </div>
          <div className="overflow-x-auto whitespace-pre flex-1 text-slate-200">
            {currentContent}
          </div>
        </pre>
      </div>

      {/* Footer Info */}
      <div className="border-t border-slate-800/80 bg-slate-900/60 px-4 py-2 flex items-center justify-between text-[11px] text-slate-400">
        <span>File: {activeFile}</span>
        <span className="font-mono tabular-nums">
          {currentContent.split('\n').length} lines · {Math.round(currentContent.length / 1024 * 10) / 10} KB
        </span>
      </div>
    </div>
  );
};
