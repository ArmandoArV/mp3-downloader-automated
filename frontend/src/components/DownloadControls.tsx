'use client';

import React from 'react';
import { Button, Spinner } from '@fluentui/react-components';
import { ArrowDownload24Regular } from '@fluentui/react-icons';

interface Props {
  disabled: boolean;
  loading: boolean;
  onDownload: () => void;
}

export default function DownloadControls({ disabled, loading, onDownload }: Props) {
  return (
    <Button
      appearance="primary"
      icon={loading ? <Spinner size="tiny" /> : <ArrowDownload24Regular />}
      onClick={onDownload}
      disabled={disabled}
      size="large"
      className="w-full"
      style={{ backgroundColor: loading ? '#6366f1' : undefined }}
    >
      {loading ? 'Downloading...' : 'Download MP3'}
    </Button>
  );
}
