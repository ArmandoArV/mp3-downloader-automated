'use client';

import React, { useState, useCallback } from 'react';
import {
  FluentProvider,
  webLightTheme,
  Text,
  Divider,
} from '@fluentui/react-components';
import UrlList from './UrlList';
import FolderPicker from './FolderPicker';
import DownloadControls from './DownloadControls';
import DownloadProgress from './DownloadProgress';
import PlaylistTab from './PlaylistTab';
import { DownloadItem } from '@/lib/types';
import { downloadAudio } from '@/lib/api';

type TabId = 'single' | 'playlist';

function nextId() {
  return crypto.randomUUID();
}

export default function DownloadApp() {
  const [activeTab, setActiveTab] = useState<TabId>('single');
  const [urls, setUrls] = useState<string[]>(['']);
  const [dirHandle, setDirHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [items, setItems] = useState<DownloadItem[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);

  const updateItem = useCallback((id: string, patch: Partial<DownloadItem>) => {
    setItems(prev => prev.map(it => it.id === id ? { ...it, ...patch } : it));
  }, []);

  const handleDownload = useCallback(async () => {
    const validUrls = urls.filter(u => u.trim() !== '');
    if (validUrls.length === 0) return;

    // Request write permission upfront while we still have user activation
    if (dirHandle) {
      try {
        const perm = await (dirHandle as FileSystemDirectoryHandle & {
          requestPermission: (opts: { mode: string }) => Promise<string>;
        }).requestPermission({ mode: 'readwrite' });
        if (perm !== 'granted') {
          setDirHandle(null);
        }
      } catch {
        setDirHandle(null);
      }
    }

    const newItems: DownloadItem[] = validUrls.map(url => ({
      id: nextId(),
      url: url.trim(),
      status: 'pending',
    }));
    setItems(newItems);
    setIsDownloading(true);

    for (const item of newItems) {
      updateItem(item.id, { status: 'downloading' });
      try {
        const { blob, filename } = await downloadAudio(item.url);

        if (dirHandle) {
          const sanitized = filename.replace(/[/\\?%*:|"<>]/g, '_');
          const fileHandle = await dirHandle.getFileHandle(sanitized, { create: true });
          const writable = await fileHandle.createWritable();
          await writable.write(blob);
          await writable.close();
          updateItem(item.id, { status: 'done', title: filename });
        } else {
          const objUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = objUrl;
          a.download = filename;
          a.click();
          URL.revokeObjectURL(objUrl);
          updateItem(item.id, { status: 'done', title: filename });
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        updateItem(item.id, { status: 'error', error: msg });
      }
    }

    setIsDownloading(false);
  }, [urls, dirHandle, updateItem]);

  const hasValidUrl = urls.some(u => u.trim() !== '');

  return (
    <FluentProvider theme={webLightTheme}>
      {/* Page background */}
      <div className="min-h-screen bg-[#0f0f13] flex flex-col">

        {/* Top nav bar */}
        <nav className="flex items-center justify-between px-8 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            {/* Logo mark */}
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-indigo-500/30">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
              </svg>
            </div>
            <span className="text-white font-semibold text-sm tracking-tight">MP3 Downloader</span>
          </div>
          <span className="text-xs text-white/30 font-mono">v1.1</span>
        </nav>

        {/* Hero */}
        <div className="flex flex-col items-center pt-16 pb-10 px-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            YouTube &amp; Spotify supported
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-3">
            Download audio,{' '}
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              instantly
            </span>
          </h1>
          <p className="text-white/40 text-base max-w-md">
            Paste YouTube or Spotify links, choose a save location, and get high-quality 192 kbps MP3s delivered straight to your device.
          </p>
        </div>

        {/* Main content */}
        <div className="w-full max-w-2xl mx-auto px-4 pb-16 flex flex-col gap-4">

          {/* Tab bar */}
          <div className="flex gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.08]">
            <button
              onClick={() => setActiveTab('single')}
              className={[
                'flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all',
                activeTab === 'single'
                  ? 'bg-gradient-to-r from-violet-600/80 to-indigo-600/80 text-white shadow-lg shadow-violet-500/20'
                  : 'text-white/40 hover:text-white/60 hover:bg-white/[0.04]',
              ].join(' ')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
              </svg>
              Single Tracks
            </button>
            <button
              onClick={() => setActiveTab('playlist')}
              className={[
                'flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all',
                activeTab === 'playlist'
                  ? 'bg-gradient-to-r from-green-600/80 to-emerald-600/80 text-white shadow-lg shadow-green-500/20'
                  : 'text-white/40 hover:text-white/60 hover:bg-white/[0.04]',
              ].join(' ')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
              Playlist
            </button>
          </div>

          {/* Tab content */}
          {activeTab === 'single' ? (
            <>
              <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm p-6 flex flex-col gap-6 shadow-2xl shadow-black/40">

                {/* Folder picker */}
                <FolderPicker dirHandle={dirHandle} onSelect={setDirHandle} />

                <Divider style={{ borderColor: 'rgba(255,255,255,0.06)' }} />

                {/* URL list */}
                <UrlList urls={urls} onChange={setUrls} disabled={isDownloading} />

                {/* Download button */}
                <DownloadControls
                  disabled={isDownloading || !hasValidUrl}
                  loading={isDownloading}
                  onDownload={handleDownload}
                />
              </div>

              {/* Progress panel */}
              {items.length > 0 && (
                <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm p-6 shadow-2xl shadow-black/40">
                  <Text className="block mb-4 text-white/70 text-sm font-semibold uppercase tracking-widest">
                    Queue
                  </Text>
                  <DownloadProgress items={items} />
                </div>
              )}
            </>
          ) : (
            <PlaylistTab />
          )}

          {/* Footer note */}
          <p className="text-center text-xs text-white/20 mt-2">
            Powered by yt-dlp &amp; Flask · For personal use only
          </p>
        </div>
      </div>
    </FluentProvider>
  );
}
