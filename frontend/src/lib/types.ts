export type DownloadStatus = 'idle' | 'pending' | 'downloading' | 'done' | 'error';

export interface DownloadItem {
  id: string;
  url: string;
  status: DownloadStatus;
  title?: string;
  error?: string;
  progress?: number;
}

export interface DownloadRequest {
  url: string;
}

export interface DownloadInfoResponse {
  title: string;
  duration: number;
  thumbnail: string;
  source: 'youtube' | 'spotify';
}

export interface PlaylistTrack {
  index: number;
  name: string;
  artists: string;
  album: string;
  duration: number;
  url: string;
  cover_url: string;
  selected: boolean;
}

export interface PlaylistInfo {
  total: number;
  tracks: Omit<PlaylistTrack, 'selected'>[];
}
