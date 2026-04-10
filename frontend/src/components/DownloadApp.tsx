'use client';

import React, { useState, useCallback } from 'react';
import {
  FluentProvider,
  webLightTheme,
  Text,
  Title1,
  Subtitle2,
} from '@fluentui/react-components';
import { MusicNote224Regular } from '@fluentui/react-icons';
import UrlList from './UrlList';
import FolderPicker from './FolderPicker';
import DownloadControls from './DownloadControls';
import DownloadProgress from './DownloadProgress';
import { DownloadItem } from '@/lib/types';
import { downloadAudio } from '@/lib/api';

function nextId() {
  return crypto.randomUUID();
}

export default function DownloadApp() {
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
          // Fallback: browser download
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

  return (
    <FluentProvider theme={webLightTheme}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4 shadow-lg">
              <MusicNote224Regular className="text-white" style={{ fontSize: 32 }} />
            </div>
            <Title1 className="block text-gray-900 font-bold">MP3 Downloader</Title1>
            <Subtitle2 className="block text-gray-500 mt-1">
              Download audio from YouTube and Spotify links
            </Subtitle2>
          </div>

          {/* Main Card */}
          <div className="bg-white rounded-2xl shadow-xl p-6 space-y-6">
            <FolderPicker dirHandle={dirHandle} onSelect={setDirHandle} />
            <UrlList urls={urls} onChange={setUrls} disabled={isDownloading} />
            <DownloadControls
              disabled={isDownloading || urls.every(u => !u.trim())}
              loading={isDownloading}
              onDownload={handleDownload}
            />
          </div>

          {/* Progress */}
          {items.length > 0 && (
            <div className="mt-6 bg-white rounded-2xl shadow-xl p-6">
              <Text weight="semibold" className="block mb-4 text-gray-700">
                Download Progress
              </Text>
              <DownloadProgress items={items} />
            </div>
          )}

          <p className="text-center text-xs text-gray-600 mt-6">
            Powered by yt-dlp · For personal use only
          </p>
        </div>
      </div>
    </FluentProvider>
  );
}
