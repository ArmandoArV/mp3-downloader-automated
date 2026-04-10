'use client';

import dynamic from 'next/dynamic';

const DownloadApp = dynamic(() => import('@/components/DownloadApp'), { ssr: false });

export default function Home() {
  return <DownloadApp />;
}
