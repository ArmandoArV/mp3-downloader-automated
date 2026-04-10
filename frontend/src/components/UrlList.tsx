'use client';

import React from 'react';
import { Button, Input, Label, Text } from '@fluentui/react-components';
import { Add24Regular, Delete24Regular } from '@fluentui/react-icons';

interface Props {
  urls: string[];
  onChange: (urls: string[]) => void;
  disabled?: boolean;
}

function isValidUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
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
    <div className="space-y-3">
      <Label weight="semibold" className="text-gray-700">
        YouTube / Spotify Links
      </Label>

      {urls.map((url, i) => {
        const invalid = url.trim() !== '' && !isValidUrl(url.trim());
        return (
          <div key={i} className="flex items-center gap-2">
            <div className="flex-1">
              <Input
                value={url}
                onChange={e => update(i, e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... or Spotify URL"
                disabled={disabled}
                appearance="outline"
                className="w-full"
                style={invalid ? { borderColor: 'red' } : undefined}
              />
              {invalid && (
                <Text size={100} className="text-red-500 mt-1 block">
                  Please enter a valid URL
                </Text>
              )}
            </div>
            {urls.length > 1 && (
              <Button
                icon={<Delete24Regular />}
                appearance="subtle"
                onClick={() => remove(i)}
                disabled={disabled}
                title="Remove"
              />
            )}
          </div>
        );
      })}

      <Button
        icon={<Add24Regular />}
        appearance="subtle"
        onClick={add}
        disabled={disabled}
        className="w-full border-dashed border-2 border-gray-300 hover:border-indigo-400"
      >
        Add another URL
      </Button>
    </div>
  );
}
