'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Text, Divider } from '@fluentui/react-components';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PlaylistTrack, DownloadItem } from '@/lib/types';
import { fetchPlaylistInfo, downloadPlaylistTrack } from '@/lib/api';
import FolderPicker from './FolderPicker';
import DownloadProgress from './DownloadProgress';

type Quality = '128' | '192' | '256' | '320';
const CONCURRENCY = 3;

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function SpotifyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#1DB954">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}

// ---------- Sortable track row ----------
function SortableTrack({
  track,
  isDownloading,
  onToggle,
  alreadyDownloaded,
}: {
  track: PlaylistTrack;
  isDownloading: boolean;
  onToggle: (index: number) => void;
  alreadyDownloaded: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: track.index.toString(),
    disabled: isDownloading,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.8 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        'flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all w-full',
        track.selected
          ? 'border-violet-500/30 bg-violet-500/10'
          : 'border-white/[0.06] bg-white/[0.02] opacity-50',
        isDragging ? 'shadow-xl shadow-violet-500/20 scale-[1.02]' : '',
      ].join(' ')}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        disabled={isDownloading}
        className="shrink-0 cursor-grab active:cursor-grabbing text-white/20 hover:text-white/40 disabled:opacity-30 touch-none"
        tabIndex={-1}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="9" cy="5" r="1.5" /><circle cx="15" cy="5" r="1.5" />
          <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
          <circle cx="9" cy="19" r="1.5" /><circle cx="15" cy="19" r="1.5" />
        </svg>
      </button>

      {/* Checkbox */}
      <button
        onClick={() => !isDownloading && onToggle(track.index)}
        disabled={isDownloading}
        className="shrink-0"
      >
        <div className={[
          'w-4 h-4 rounded border flex items-center justify-center transition-all',
          track.selected ? 'bg-violet-500 border-violet-500' : 'border-white/20 bg-transparent',
        ].join(' ')}>
          {track.selected && (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>
      </button>

      {/* Cover art */}
      {track.cover_url ? (
        <img src={track.cover_url} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
      ) : (
        <div className="w-9 h-9 rounded-lg bg-white/[0.06] shrink-0 flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2">
            <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
          </svg>
        </div>
      )}

      {/* Track info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium text-white/80 truncate">{track.name}</p>
          {alreadyDownloaded && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/20 text-[9px] text-emerald-300 font-semibold shrink-0">
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Saved
            </span>
          )}
        </div>
        <p className="text-[11px] text-white/40 truncate">{track.artists}{track.album ? ` · ${track.album}` : ''}</p>
      </div>

      {/* Duration */}
      {track.duration > 0 && (
        <span className="text-xs text-white/25 font-mono shrink-0">
          {formatDuration(track.duration)}
        </span>
      )}
    </div>
  );
}

// ---------- Download history helpers ----------
const HISTORY_KEY = 'mp3dl_downloaded_tracks';

function getDownloadHistory(): Set<string> {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function addToHistory(trackKey: string) {
  const history = getDownloadHistory();
  history.add(trackKey);
  localStorage.setItem(HISTORY_KEY, JSON.stringify([...history]));
}

function trackKey(t: { name: string; artists: string }): string {
  return `${t.artists}::${t.name}`.toLowerCase();
}

// ---------- Main component ----------
export default function PlaylistTab() {
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [tracks, setTracks] = useState<PlaylistTrack[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState('');
  const [playlistName, setPlaylistName] = useState('');
  const [quality, setQuality] = useState<Quality>('192');
  const [dirHandle, setDirHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [items, setItems] = useState<DownloadItem[]>([]);
  const [downloadedKeys, setDownloadedKeys] = useState<Set<string>>(new Set());
  const cancelledRef = useRef(false);

  useEffect(() => {
    setDownloadedKeys(getDownloadHistory());
  }, []);

  const updateItem = useCallback((id: string, patch: Partial<DownloadItem>) => {
    setItems(prev => prev.map(it => (it.id === id ? { ...it, ...patch } : it)));
  }, []);

  const handleFetchPlaylist = async () => {
    if (!playlistUrl.trim()) return;
    setError('');
    setTracks([]);
    setItems([]);
    setPlaylistName('');
    setIsLoading(true);
    try {
      const data = await fetchPlaylistInfo(playlistUrl.trim());
      setPlaylistName(data.name || '');
      const history = getDownloadHistory();
      setDownloadedKeys(history);
      setTracks(data.tracks.map(t => ({
        ...t,
        selected: !history.has(trackKey(t)),
      })));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch playlist');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTrack = (index: number) => {
    setTracks(prev => prev.map(t => (t.index === index ? { ...t, selected: !t.selected } : t)));
  };

  const toggleAll = () => {
    const allSelected = tracks.every(t => t.selected);
    setTracks(prev => prev.map(t => ({ ...t, selected: !allSelected })));
  };

  const sortByName = () => setTracks(prev => [...prev].sort((a, b) => a.name.localeCompare(b.name)));
  const sortByArtist = () => setTracks(prev => [...prev].sort((a, b) => a.artists.localeCompare(b.artists)));
  const sortByOriginal = () => setTracks(prev => [...prev].sort((a, b) => a.index - b.index));
  const shuffleTracks = () => {
    setTracks(prev => {
      const s = [...prev];
      for (let i = s.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [s[i], s[j]] = [s[j], s[i]];
      }
      return s;
    });
  };

  const selectNewOnly = () => {
    const history = getDownloadHistory();
    setTracks(prev => prev.map(t => ({ ...t, selected: !history.has(trackKey(t)) })));
  };

  const selectedCount = tracks.filter(t => t.selected).length;
  const alreadyDownloadedCount = tracks.filter(t => downloadedKeys.has(trackKey(t))).length;

  // Drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setTracks(prev => {
        const oldIdx = prev.findIndex(t => t.index.toString() === active.id);
        const newIdx = prev.findIndex(t => t.index.toString() === over.id);
        return arrayMove(prev, oldIdx, newIdx);
      });
    }
  };

  // Concurrent download handler
  const handleDownload = useCallback(async () => {
    const selected = tracks.filter(t => t.selected);
    if (selected.length === 0) return;
    cancelledRef.current = false;

    if (dirHandle) {
      try {
        const perm = await (dirHandle as FileSystemDirectoryHandle & {
          requestPermission: (opts: { mode: string }) => Promise<string>;
        }).requestPermission({ mode: 'readwrite' });
        if (perm !== 'granted') {
          alert('Folder write permission is required. Files will use browser downloads instead.');
          setDirHandle(null);
        }
      } catch { setDirHandle(null); }
    }

    const newItems: DownloadItem[] = selected.map(t => ({
      id: crypto.randomUUID(),
      url: t.url,
      status: 'pending',
      title: `${t.artists} - ${t.name}`,
    }));
    setItems(newItems);
    setIsDownloading(true);

    // Concurrent download with a pool of CONCURRENCY workers
    let nextIdx = 0;
    const processNext = async (): Promise<void> => {
      while (nextIdx < newItems.length) {
        if (cancelledRef.current) break;
        const i = nextIdx++;
        const item = newItems[i];
        const track = selected[i];
        updateItem(item.id, { status: 'downloading' });
        try {
          const { blob, filename } = await downloadPlaylistTrack(track.name, track.artists, quality);
          if (cancelledRef.current) break;

          if (dirHandle) {
            const sanitized = filename.replace(/[/\\?%*:|"<>]/g, '_');
            const fh = await dirHandle.getFileHandle(sanitized, { create: true });
            const wr = await fh.createWritable();
            await wr.write(blob);
            await wr.close();
          } else {
            const objUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = objUrl;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(objUrl);
          }
          updateItem(item.id, { status: 'done', title: filename });
          addToHistory(trackKey(track));
          setDownloadedKeys(prev => new Set([...prev, trackKey(track)]));
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Unknown error';
          updateItem(item.id, { status: 'error', error: msg });
        }
      }
    };

    const workers = Array.from({ length: Math.min(CONCURRENCY, selected.length) }, () => processNext());
    await Promise.all(workers);
    setIsDownloading(false);
  }, [tracks, dirHandle, updateItem, quality]);

  const handleCancel = () => { cancelledRef.current = true; };

  const isValidPlaylistUrl = (() => {
    try {
      const u = new URL(playlistUrl);
      return u.hostname.includes('spotify.com') && u.pathname.includes('/playlist/');
    } catch { return false; }
  })();

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm p-6 flex flex-col gap-6 shadow-2xl shadow-black/40">

        {/* Folder picker */}
        <FolderPicker dirHandle={dirHandle} onSelect={setDirHandle} />

        <Divider style={{ borderColor: 'rgba(255,255,255,0.06)' }} />

        {/* Quality selector */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-white/50 uppercase tracking-widest">Quality</label>
          <div className="flex gap-1.5">
            {(['128', '192', '256', '320'] as Quality[]).map(q => (
              <button
                key={q}
                onClick={() => setQuality(q)}
                disabled={isDownloading}
                className={[
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border',
                  quality === q
                    ? 'bg-violet-500/20 border-violet-500/40 text-violet-300'
                    : 'bg-white/[0.03] border-white/[0.08] text-white/40 hover:text-white/60 hover:bg-white/[0.06]',
                  isDownloading ? 'opacity-40' : '',
                ].join(' ')}
              >
                {q} kbps
              </button>
            ))}
          </div>
        </div>

        <Divider style={{ borderColor: 'rgba(255,255,255,0.06)' }} />

        {/* Playlist URL input */}
        <div className="flex flex-col gap-3">
          <label className="text-xs font-semibold text-white/50 uppercase tracking-widest">Spotify Playlist URL</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              {playlistUrl.trim() && isValidPlaylistUrl && (
                <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"><SpotifyIcon /></span>
              )}
              <input
                type="url"
                value={playlistUrl}
                onChange={e => setPlaylistUrl(e.target.value)}
                placeholder="https://open.spotify.com/playlist/..."
                disabled={isLoading || isDownloading}
                className={[
                  'w-full rounded-xl bg-white/[0.06] border text-sm text-white placeholder-white/20',
                  'px-4 py-2.5 outline-none transition-all focus:bg-white/[0.09] focus:ring-1',
                  playlistUrl.trim() && isValidPlaylistUrl ? 'pl-9' : '',
                  'border-white/10 focus:border-violet-500/50 focus:ring-violet-500/20',
                  isLoading || isDownloading ? 'opacity-40 cursor-not-allowed' : '',
                ].join(' ')}
                onKeyDown={e => { if (e.key === 'Enter' && isValidPlaylistUrl) handleFetchPlaylist(); }}
              />
            </div>
            <button
              onClick={handleFetchPlaylist}
              disabled={!isValidPlaylistUrl || isLoading || isDownloading}
              className={[
                'px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 shrink-0',
                'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/25',
                isValidPlaylistUrl && !isLoading && !isDownloading
                  ? 'hover:from-green-500 hover:to-emerald-500 hover:shadow-green-500/40 hover:-translate-y-px active:translate-y-0'
                  : 'opacity-40 cursor-not-allowed',
              ].join(' ')}
            >
              {isLoading ? (
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
              ) : 'Fetch'}
            </button>
          </div>
          {error && <p className="text-xs text-red-400 mt-1">⚠ {error}</p>}
        </div>

        {/* Loading state */}
        {isLoading && (
          <>
            <Divider style={{ borderColor: 'rgba(255,255,255,0.06)' }} />
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 px-3 py-3">
                <svg className="animate-spin shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-white/60 font-medium">Fetching playlist tracks…</span>
                  <span className="text-[11px] text-white/30">This may take a moment for large playlists</span>
                </div>
              </div>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-white/[0.04] bg-white/[0.02] animate-pulse">
                  <div className="w-4 h-4 rounded bg-white/[0.06]" />
                  <div className="w-9 h-9 rounded-lg bg-white/[0.06]" />
                  <div className="flex-1 flex flex-col gap-1.5">
                    <div className="h-3 w-2/3 rounded bg-white/[0.06]" />
                    <div className="h-2.5 w-1/3 rounded bg-white/[0.04]" />
                  </div>
                  <div className="h-3 w-8 rounded bg-white/[0.04]" />
                </div>
              ))}
            </div>
          </>
        )}

        {/* Track list */}
        {!isLoading && tracks.length > 0 && (
          <>
            <Divider style={{ borderColor: 'rgba(255,255,255,0.06)' }} />

            <div className="flex flex-col gap-3">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  {playlistName && <span className="text-sm font-semibold text-white/70">{playlistName}</span>}
                  <label className="text-xs font-semibold text-white/50 uppercase tracking-widest">
                    Tracks ({selectedCount}/{tracks.length})
                    {alreadyDownloadedCount > 0 && (
                      <span className="ml-2 text-emerald-400/70 normal-case">· {alreadyDownloadedCount} already saved</span>
                    )}
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  {alreadyDownloadedCount > 0 && (
                    <button
                      onClick={selectNewOnly}
                      disabled={isDownloading}
                      className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors disabled:opacity-40"
                    >
                      New only
                    </button>
                  )}
                  <button
                    onClick={toggleAll}
                    disabled={isDownloading}
                    className="text-xs text-violet-400 hover:text-violet-300 transition-colors disabled:opacity-40"
                  >
                    {tracks.every(t => t.selected) ? 'Deselect all' : 'Select all'}
                  </button>
                </div>
              </div>

              {/* Sort controls */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-white/30 uppercase tracking-wider mr-1">Order:</span>
                {([
                  { label: 'Original', action: sortByOriginal, icon: <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="15" y2="12" /><line x1="3" y1="18" x2="9" y2="18" /></svg> },
                  { label: 'Title', action: sortByName, icon: <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M4 6h16M4 12h10M4 18h6" /></svg> },
                  { label: 'Artist', action: sortByArtist, icon: <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg> },
                  { label: 'Shuffle', action: shuffleTracks, icon: <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" /><polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" /><line x1="4" y1="4" x2="9" y2="9" /></svg> },
                ] as const).map(({ label, action, icon }) => (
                  <button key={label} onClick={action} disabled={isDownloading}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-white/[0.08] bg-white/[0.03] text-[11px] text-white/50 hover:text-white/80 hover:bg-white/[0.07] hover:border-white/15 transition-all disabled:opacity-30">
                    {icon} {label}
                  </button>
                ))}
              </div>

              {/* Drag-and-drop track list */}
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={tracks.map(t => t.index.toString())} strategy={verticalListSortingStrategy}>
                  <div className="flex flex-col gap-1 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                    {tracks.map(track => (
                      <SortableTrack
                        key={track.index}
                        track={track}
                        isDownloading={isDownloading}
                        onToggle={toggleTrack}
                        alreadyDownloaded={downloadedKeys.has(trackKey(track))}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              {/* Download / Cancel button */}
              <button
                onClick={isDownloading ? handleCancel : handleDownload}
                disabled={!isDownloading && selectedCount === 0}
                className={[
                  'relative w-full py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2.5 mt-2',
                  isDownloading
                    ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-500/25 hover:from-red-500 hover:to-rose-500'
                    : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25',
                  !isDownloading && selectedCount > 0
                    ? 'hover:from-violet-500 hover:to-indigo-500 hover:shadow-violet-500/40 hover:-translate-y-px active:translate-y-0'
                    : !isDownloading ? 'opacity-40 cursor-not-allowed' : '',
                ].join(' ')}
              >
                {isDownloading ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="6" y="6" width="12" height="12" rx="1" /></svg>
                    Cancel
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Download {selectedCount} track{selectedCount !== 1 ? 's' : ''} at {quality} kbps
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Progress panel */}
      {items.length > 0 && (
        <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm p-6 shadow-2xl shadow-black/40">
          <div className="flex items-center justify-between mb-4">
            <Text className="text-white/70 text-sm font-semibold uppercase tracking-widest">Queue</Text>
            <span className="text-xs text-white/40 font-mono">
              {items.filter(i => i.status === 'done').length}/{items.length} complete
            </span>
          </div>
          {isDownloading && (
            <div className="h-1 rounded-full bg-white/10 overflow-hidden mb-4">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-indigo-400 transition-all duration-500 ease-out"
                style={{ width: `${(items.filter(i => i.status === 'done' || i.status === 'error').length / items.length) * 100}%` }}
              />
            </div>
          )}
          <DownloadProgress items={items} />
        </div>
      )}
    </div>
  );
}
