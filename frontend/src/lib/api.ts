const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function fetchInfo(url: string): Promise<{ title: string; thumbnail?: string }> {
  const res = await fetch(`${API_BASE}/api/info`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || 'Failed to fetch info');
  }
  return res.json();
}

export async function downloadAudio(url: string, quality: string = '192'): Promise<{ blob: Blob; filename: string }> {
  const res = await fetch(`${API_BASE}/api/download`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, quality }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Download failed' }));
    throw new Error(err.error || 'Download failed');
  }
  const disposition = res.headers.get('content-disposition') || '';
  const xFilename = res.headers.get('x-filename') || '';
  const utf8Match = disposition.match(/filename\*=UTF-8''([^;\r\n]+)/i);
  const plainMatch = disposition.match(/filename="([^"]+)"/i);
  const filename = utf8Match ? decodeURIComponent(utf8Match[1])
    : plainMatch ? plainMatch[1]
    : xFilename ? decodeURIComponent(xFilename)
    : 'audio.mp3';
  const blob = await res.blob();
  return { blob, filename };
}

export async function fetchPlaylistInfo(url: string): Promise<{ name: string; total: number; tracks: Array<{
  index: number; name: string; artists: string; album: string;
  duration: number; url: string; cover_url: string;
}> }> {
  const res = await fetch(`${API_BASE}/api/playlist/info`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || 'Failed to fetch playlist');
  }
  return res.json();
}

export async function downloadPlaylistTrack(name: string, artists: string, quality: string = '192'): Promise<{ blob: Blob; filename: string }> {
  const res = await fetch(`${API_BASE}/api/playlist/download`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, artists, quality }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Download failed' }));
    throw new Error(err.error || 'Download failed');
  }
  const disposition = res.headers.get('content-disposition') || '';
  const xFilename = res.headers.get('x-filename') || '';
  // Prefer filename* (RFC 5987 UTF-8), then x-filename, then fallback
  const utf8Match = disposition.match(/filename\*=UTF-8''([^;\r\n]+)/i);
  const plainMatch = disposition.match(/filename="([^"]+)"/i);
  const filename = utf8Match ? decodeURIComponent(utf8Match[1])
    : plainMatch ? plainMatch[1]
    : xFilename ? decodeURIComponent(xFilename)
    : `${artists} - ${name}.mp3`;
  const blob = await res.blob();
  return { blob, filename };
}
