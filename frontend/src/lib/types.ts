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
