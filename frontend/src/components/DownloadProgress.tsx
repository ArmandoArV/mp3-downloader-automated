'use client';

import React from 'react';
import { Badge, ProgressBar, Text, Tooltip } from '@fluentui/react-components';
import {
  CheckmarkCircle24Regular,
  ErrorCircle24Regular,
  ArrowClockwise24Regular,
  Clock24Regular,
} from '@fluentui/react-icons';
import { DownloadItem } from '@/lib/types';

interface Props {
  items: DownloadItem[];
}

function StatusBadge({ status }: { status: DownloadItem['status'] }) {
  switch (status) {
    case 'done':
      return <Badge color="success" icon={<CheckmarkCircle24Regular />} appearance="tint">Done</Badge>;
    case 'error':
      return <Badge color="danger" icon={<ErrorCircle24Regular />} appearance="tint">Error</Badge>;
    case 'downloading':
      return <Badge color="brand" icon={<ArrowClockwise24Regular />} appearance="tint">Downloading</Badge>;
    default:
      return <Badge color="subtle" icon={<Clock24Regular />} appearance="tint">Pending</Badge>;
  }
}

export default function DownloadProgress({ items }: Props) {
  return (
    <div className="space-y-4">
      {items.map(item => (
        <div key={item.id} className="border border-gray-100 rounded-xl p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <Text size={200} className="block text-gray-500 truncate" title={item.url}>
                {item.url}
              </Text>
              {item.title && (
                <Text size={300} weight="semibold" className="block text-gray-700 truncate">
                  {item.title}
                </Text>
              )}
              {item.error && (
                <Tooltip content={item.error} relationship="description">
                  <Text size={200} className="block text-red-500 truncate cursor-help">
                    ⚠ {item.error}
                  </Text>
                </Tooltip>
              )}
            </div>
            <StatusBadge status={item.status} />
          </div>
          {item.status === 'downloading' && (
            <ProgressBar thickness="medium" />
          )}
        </div>
      ))}
    </div>
  );
}
