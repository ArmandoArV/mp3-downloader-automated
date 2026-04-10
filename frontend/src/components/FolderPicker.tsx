'use client';

import React from 'react';
import { Button, Badge, Label, Text } from '@fluentui/react-components';
import { Folder24Regular, FolderOpen24Regular } from '@fluentui/react-icons';

interface Props {
  dirHandle: FileSystemDirectoryHandle | null;
  onSelect: (handle: FileSystemDirectoryHandle) => void;
}

export default function FolderPicker({ dirHandle, onSelect }: Props) {
  const supported = typeof window !== 'undefined' && 'showDirectoryPicker' in window;

  const pick = async () => {
    try {
      const handle = await (window as Window & typeof globalThis & {
        showDirectoryPicker: () => Promise<FileSystemDirectoryHandle>
      }).showDirectoryPicker();
      onSelect(handle);
    } catch {
      // User cancelled
    }
  };

  return (
    <div className="space-y-2">
      <Label weight="semibold" className="text-gray-700">
        Save To Folder
      </Label>

      {supported ? (
        <div className="flex items-center gap-3">
          <Button
            icon={dirHandle ? <FolderOpen24Regular /> : <Folder24Regular />}
            appearance="secondary"
            onClick={pick}
            className="shrink-0"
          >
            {dirHandle ? 'Change Folder' : 'Select Folder'}
          </Button>
          {dirHandle ? (
            <Badge color="success" appearance="tint" icon={<FolderOpen24Regular />}>
              {dirHandle.name}
            </Badge>
          ) : (
            <Text size={200} className="text-gray-400">
              No folder selected — files will be saved via browser download
            </Text>
          )}
        </div>
      ) : (
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-2">
          <Text size={200} className="text-yellow-800">
            Directory picker is not supported in this browser. Files will be downloaded via your browser&apos;s download manager.
          </Text>
        </div>
      )}
    </div>
  );
}
