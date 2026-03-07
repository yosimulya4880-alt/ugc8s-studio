import React, { useMemo, useState } from 'react';
import { getJob } from '../services/api';
import type { ApiJob } from '../types';

type JobCardProps = {
  job: ApiJob;
  token?: string;
  apiBaseUrl?: string;
  onJobRefresh?: (job: ApiJob) => void;
};

function getDisplayUrl(job: ApiJob): string | undefined {
  return (job as any)?.result?.url || (job as any)?.resultUrl || undefined;
}

function isUsableHttpUrl(value?: string): boolean {
  if (!value) return false;
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:' || u.protocol === 'data:';
  } catch {
    return false;
  }
}

function isSignedUrlExpired(url?: string): boolean {
  if (!url || url.startsWith('data:')) return false;
  try {
    const parsed = new URL(url);
    const date = parsed.searchParams.get('X-Goog-Date');
    const expires = parsed.searchParams.get('X-Goog-Expires');
    if (!date || !expires) return false;

    const year = Number(date.slice(0, 4));
    const month = Number(date.slice(4, 6)) - 1;
    const day = Number(date.slice(6, 8));
    const hour = Number(date.slice(9, 11));
    const minute = Number(date.slice(11, 13));
    const second = Number(date.slice(13, 15));
    const signedAt = Date.UTC(year, month, day, hour, minute, second);
    const expiresAt = signedAt + Number(expires) * 1000;
    return Date.now() > expiresAt - 15000;
  } catch {
    return false;
  }
}

export default function JobCard({ job, token, apiBaseUrl, onJobRefresh }: JobCardProps) {
  const [isOpening, setIsOpening] = useState(false);
  const [message, setMessage] = useState('');

  const initialUrl = useMemo(() => getDisplayUrl(job), [job]);
  const canView = isUsableHttpUrl(initialUrl) || (job as any)?.status === 'succeeded';

  async function handleViewMedia() {
    setMessage('');
    setIsOpening(true);

    try {
      let latestJob = job;
      let url = getDisplayUrl(latestJob);
      const needsRefresh = !isUsableHttpUrl(url) || isSignedUrlExpired(url);

      if (needsRefresh) {
        latestJob = await getJob((job as any).jobId, token, apiBaseUrl);
        onJobRefresh?.(latestJob);
        url = getDisplayUrl(latestJob);
      }

      if (!isUsableHttpUrl(url)) {
        throw new Error('Media belum punya URL preview yang valid.');
      }

      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      setMessage(err?.message || 'Gagal membuka media.');
    } finally {
      setIsOpening(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm text-white/60">ID: {(job as any).jobId}</div>
          <div className="truncate font-medium text-white">{(job as any).prompt || 'Untitled job'}</div>
        </div>
        <span className="rounded-full border border-white/10 px-2 py-1 text-xs text-white/70">
          {(job as any).status}
        </span>
      </div>

      <button
        type="button"
        onClick={handleViewMedia}
        disabled={!canView || isOpening}
        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {isOpening ? 'Opening...' : 'View Media'}
      </button>

      {message ? <div className="text-xs text-amber-300">{message}</div> : null}
    </div>
  );
}
