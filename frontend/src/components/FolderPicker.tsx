'use client';

import React from 'react';

interface Props {
  dirHandle: FileSystemDirectoryHandle | null;
  onSelect: (handle: FileSystemDirectoryHandle) => void;
}

export default function FolderPicker({ dirHandle, onSelect }: Props) {
  const supported = typeof window !== 'undefined' && 'showDirectoryPicker' in window;

  const pick = async () => {
    try {
      const handle = await (window as Window & typeof globalThis & {
        showDirectoryPicker: () => Promise<FileSystemDirectoryHandle>;
      }).showDirectoryPicker();
      onSelect(handle);
    } catch {
      // User cancelled
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <label className="text-xs font-semibold text-white/50 uppercase tracking-widest">
        Save Location
      </label>

      {supported ? (
        <button
          onClick={pick}
          className={[
            'flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all',
            dirHandle
              ? 'border-violet-500/40 bg-violet-500/10 hover:bg-violet-500/15'
              : 'border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.07]',
          ].join(' ')}
        >
          {/* Folder icon */}
          <div className={[
            'flex items-center justify-center w-9 h-9 rounded-lg shrink-0',
            dirHandle ? 'bg-violet-500/20' : 'bg-white/[0.06]',
          ].join(' ')}>
            {dirHandle ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                <polyline points="12 11 9 14 12 17" /><line x1="15" y1="14" x2="9" y2="14" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
            )}
          </div>

          <div className="flex-1 min-w-0">
            {dirHandle ? (
              <>
                <p className="text-sm font-medium text-violet-300 truncate">{dirHandle.name}</p>
                <p className="text-xs text-white/30 mt-0.5">Click to change folder</p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-white/60">Choose a folder</p>
                <p className="text-xs text-white/30 mt-0.5">Files are saved directly — no browser prompt</p>
              </>
            )}
          </div>

          {/* Arrow */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      ) : (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.07]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-xs text-amber-300/80">
            Folder picker not supported — files will use your browser&apos;s download manager.
          </p>
        </div>
      )}
    </div>
  );
}
