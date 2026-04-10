import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MP3 Downloader',
  description: 'Download MP3 from YouTube and Spotify links',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 dark:bg-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
