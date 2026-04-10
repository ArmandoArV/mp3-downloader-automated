'use client';

import React from 'react';
import { DownloadItem } from '@/lib/types';

interface Props {
  items: DownloadItem[];
}

function StatusPill({ status }: { status: DownloadItem['status'] }) {
  const map: Record<DownloadItem['status'], { label: string; cls: string; icon: React.ReactNode }> = {
    idle: {
      label: 'Idle',
      cls: 'bg-white/[0.06] text-white/30 border-white/10',
      icon: null,
    },
    done: {
      label: 'Done',
      cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
      icon: (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ),
    },
    error: {
      label: 'Error',
      cls: 'bg-red-500/15 text-red-300 border-red-500/20',
      icon: (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      ),
    },
    downloading: {
      label: 'Downloading',
      cls: 'bg-violet-500/15 text-violet-300 border-violet-500/20',
      icon: (
        <svg className="animate-spin" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      ),
    },
    pending: {
      label: 'Pending',
      cls: 'bg-white/[0.06] text-white/40 border-white/10',
      icon: (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
  };

  const { label, cls, icon } = map[status];

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${cls}`}>
      {icon}
      {label}
    </span>
  );
}

function truncateUrl(url: string, max = 48): string {
  try {
    const { hostname, pathname } = new URL(url);
    const short = `${hostname}${pathname}`;
    return short.length > max ? short.slice(0, max) + '…' : short;
  } catch {
    return url.length > max ? url.slice(0, max) + '…' : url;
  }
}

export default function DownloadProgress({ items }: Props) {
  return (
    <div className="flex flex-col gap-2">
      {items.map(item => (
        <div
          key={item.id}
          className={[
            'rounded-xl border px-4 py-3 transition-all',
            item.status === 'downloading' ? 'border-violet-500/30 bg-violet-500/5' :
            item.status === 'done' ? 'border-emerald-500/20 bg-emerald-500/5' :
            item.status === 'error' ? 'border-red-500/20 bg-red-500/5' :
            'border-white/[0.06] bg-white/[0.03]',
          ].join(' ')}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {item.title ? (
                <>
                  <p className="text-sm font-medium text-white/80 truncate">{item.title}</p>
                  <p className="text-[11px] text-white/30 mt-0.5 truncate">{truncateUrl(item.url)}</p>
                </>
              ) : (
                <p className="text-sm text-white/50 truncate">{truncateUrl(item.url)}</p>
              )}
              {item.error && (
                <p className="text-[11px] text-red-400/80 mt-1 truncate" title={item.error}>
                  ⚠ {item.error}
                </p>
              )}
            </div>
            <StatusPill status={item.status} />
          </div>

          {/* Indeterminate progress bar while downloading */}
          {item.status === 'downloading' && (
            <div className="mt-2.5 h-0.5 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-400 animate-[progress_1.4s_ease-in-out_infinite]" style={{ width: '40%' }} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
