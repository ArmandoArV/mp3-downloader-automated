'use client';

import React from 'react';

interface Props {
  disabled: boolean;
  loading: boolean;
  onDownload: () => void;
}

export default function DownloadControls({ disabled, loading, onDownload }: Props) {
  return (
    <button
      onClick={onDownload}
      disabled={disabled}
      className={[
        'relative w-full py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2.5',
        'bg-gradient-to-r from-violet-600 to-indigo-600 text-white',
        'shadow-lg shadow-violet-500/25',
        !disabled
          ? 'hover:from-violet-500 hover:to-indigo-500 hover:shadow-violet-500/40 hover:-translate-y-px active:translate-y-0'
          : 'opacity-40 cursor-not-allowed',
      ].join(' ')}
    >
      {loading ? (
        <>
          {/* Spinner */}
          <svg
            className="animate-spin"
            width="16" height="16" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          Downloading…
        </>
      ) : (
        <>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Download MP3
        </>
      )}
    </button>
  );
}
