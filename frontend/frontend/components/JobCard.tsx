import React, { useMemo, useState } from 'react';
import type { JobRecord } from '../types';

/**
 * Local status normalizer.
 * Sengaja di-inline supaya JobCard TIDAK bergantung pada export `normalizeJobStatus` dari types.ts
 * (karena export itu tidak ada di repo-mu, dan bikin Vercel build gagal).
 */
function normalizeJobStatus(status?: string): string {
  if (!status) return 'queued';
  const s = String(status).toLowerCase();
  if (['queued', 'pending', 'submitted'].includes(s)) return 'queued';
  if (['processing', 'running', 'in_progress', 'working'].includes(s)) return 'running';
  if (['succeeded', 'success', 'completed', 'done'].includes(s)) return 'succeeded';
  if (['failed', 'error'].includes(s)) return 'failed';
  if (['cancelled', 'canceled'].includes(s)) return 'cancelled';
  return s;
}

type JobCardProps = {
  job: JobRecord;
  onRefresh?: (jobId: string) => void | Promise<void>;
};

function getResultUrl(job: JobRecord): string | undefined {
  return job.result?.url || (job as any).resultUrl;
}

function getErrorText(error: JobRecord['error']): string | undefined {
  if (!error) return undefined;
  if (typeof error === 'string') return error;
  return (error as any).message || 'Terjadi error yang tidak diketahui.';
}

async function copyText(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      const ok = document.execCommand('copy');
      document.body.removeChild(textarea);
      return ok;
    } catch {
      document.body.removeChild(textarea);
      return false;
    }
  }
}

export default function JobCard({ job, onRefresh }: JobCardProps) {
  const [copied, setCopied] = useState(false);

  const status = useMemo(() => normalizeJobStatus(job.status), [job.status]);
  const resultUrl = useMemo(() => getResultUrl(job), [job]);
  const errorText = useMemo(() => getErrorText(job.error), [job.error]);

  const handleCopy = async () => {
    const ok = await copyText(job.jobId);
    setCopied(ok);
    setTimeout(() => setCopied(false), 1200);
  };

  const handleView = () => {
    if (!resultUrl) return;
    window.open(resultUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                status === 'succeeded'
                  ? 'bg-emerald-500/15 text-emerald-300'
                  : status === 'failed'
                  ? 'bg-rose-500/15 text-rose-300'
                  : status === 'running'
                  ? 'bg-amber-500/15 text-amber-300'
                  : 'bg-slate-500/15 text-slate-300'
              }`}
            >
              {status}
            </span>

            <span className="text-xs text-white/60">ID:</span>
            <button
              type="button"
              onClick={handleCopy}
              className="truncate text-xs font-mono text-white/80 hover:text-white"
              title="Copy Job ID"
            >
              {job.jobId}
            </button>

            {copied && <span className="text-xs text-emerald-300">copied</span>}
          </div>

          {job.prompt && (
            <div className="mt-2 line-clamp-2 text-sm font-semibold text-white">
              {job.prompt}
            </div>
          )}

          <div className="mt-1 text-xs text-white/60">
            {job.provider ? String(job.provider).toUpperCase() : 'PROVIDER'}{' '}
            {job.toolType ? `• ${String(job.toolType).toUpperCase()}` : ''}
          </div>

          {errorText && (
            <div className="mt-2 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
              {errorText}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {onRefresh && (
            <button
              type="button"
              onClick={() => onRefresh(job.jobId)}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 hover:bg-white/10"
              title="Refresh job"
            >
              Refresh
            </button>
          )}

          <button
            type="button"
            onClick={handleView}
            disabled={!resultUrl}
            className={`rounded-lg px-3 py-2 text-xs ${
              resultUrl
                ? 'bg-white/10 text-white hover:bg-white/15'
                : 'bg-white/5 text-white/30 cursor-not-allowed'
            }`}
          >
            View Media
          </button>
        </div>
      </div>
    </div>
  );
}
