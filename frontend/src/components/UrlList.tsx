'use client';

import React from 'react';
import { Text } from '@fluentui/react-components';

interface Props {
  urls: string[];
  onChange: (urls: string[]) => void;
  disabled?: boolean;
}

function detectPlatform(url: string): 'youtube' | 'spotify' | null {
  try {
    const { hostname } = new URL(url);
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) return 'youtube';
    if (hostname.includes('spotify.com')) return 'spotify';
  } catch {
    // not a valid URL yet
  }
  return null;
}

function isValidUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function YouTubeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#FF0000">
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.75 15.5V8.5l6.25 3.5-6.25 3.5z" />
    </svg>
  );
}

function SpotifyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#1DB954">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}

export default function UrlList({ urls, onChange, disabled }: Props) {
  const update = (i: number, val: string) => {
    const next = [...urls];
    next[i] = val;
    onChange(next);
  };

  const add = () => onChange([...urls, '']);

  const remove = (i: number) => {
    const next = urls.filter((_, idx) => idx !== i);
    onChange(next.length ? next : ['']);
  };

  return (
    <div className="flex flex-col gap-3">
      <label className="text-xs font-semibold text-white/50 uppercase tracking-widest">
        Links
      </label>

      <div className="flex flex-col gap-2">
        {urls.map((url, i) => {
          const platform = url.trim() ? detectPlatform(url.trim()) : null;
          const invalid = url.trim() !== '' && !isValidUrl(url.trim());

          return (
            <div key={i} className="flex items-center gap-2">
              {/* Row number */}
              <span className="text-xs text-white/20 font-mono w-5 text-right shrink-0">
                {i + 1}
              </span>

              {/* Input wrapper */}
              <div className="relative flex-1">
                {/* Platform icon */}
                {platform && (
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    {platform === 'youtube' ? <YouTubeIcon /> : <SpotifyIcon />}
                  </span>
                )}
                <input
                  type="url"
                  value={url}
                  onChange={e => update(i, e.target.value)}
                  placeholder="https://youtube.com/watch?v=… or Spotify link"
                  disabled={disabled}
                  className={[
                    'w-full rounded-xl bg-white/[0.06] border text-sm text-white placeholder-white/20',
                    'px-4 py-2.5 outline-none transition-all',
                    'focus:bg-white/[0.09] focus:ring-1',
                    platform ? 'pl-9' : '',
                    invalid
                      ? 'border-red-500/50 focus:ring-red-500/30'
                      : 'border-white/10 focus:border-violet-500/50 focus:ring-violet-500/20',
                    disabled ? 'opacity-40 cursor-not-allowed' : '',
                  ].join(' ')}
                />
                {invalid && (
                  <Text size={100} className="absolute -bottom-4 left-0 text-red-400 text-[10px]">
                    Please enter a valid URL
                  </Text>
                )}
              </div>

              {/* Remove button */}
              {urls.length > 1 && (
                <button
                  onClick={() => remove(i)}
                  disabled={disabled}
                  title="Remove"
                  className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-30"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Add row */}
      <button
        onClick={add}
        disabled={disabled}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-white/10 text-white/30 text-sm hover:border-violet-500/40 hover:text-violet-300 hover:bg-violet-500/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add another link
      </button>
    </div>
  );
}
