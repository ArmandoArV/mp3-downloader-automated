const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function fetchInfo(url: string): Promise<{ title: string; thumbnail?: string }> {
  const res = await fetch(`${API_BASE}/api/info`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(err.detail || 'Failed to fetch info');
  }
  return res.json();
}

export async function downloadAudio(url: string): Promise<{ blob: Blob; filename: string }> {
  const res = await fetch(`${API_BASE}/api/download`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Download failed' }));
    throw new Error(err.detail || 'Download failed');
  }
  const disposition = res.headers.get('content-disposition') || '';
  const match = disposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';\r\n]+)["']?/i);
  const filename = match ? decodeURIComponent(match[1]) : 'audio.mp3';
  const blob = await res.blob();
  return { blob, filename };
}
