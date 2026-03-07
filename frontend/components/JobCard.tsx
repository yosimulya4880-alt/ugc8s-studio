import type { JobRecord } from '../types';
import { normalizeJobStatus } from '../types';

type JobCardProps = {
  job: JobRecord;
  onRefresh?: (jobId: string) => void | Promise<void>;
};

function getResultUrl(job: JobRecord): string | undefined {
  return job.result?.url || job.resultUrl;
}

function getErrorText(error: JobRecord['error']): string | undefined {
  if (!error) return undefined;
  if (typeof error === 'string') return error;
  return error.message || 'Terjadi error yang tidak diketahui.';
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
      return ok;
    } finally {
      document.body.removeChild(textarea);
    }
  }
}

export default function JobCard({ job, onRefresh }: JobCardProps) {
  const normalizedStatus = normalizeJobStatus(job.status);
  const resultUrl = getResultUrl(job);
  const errorText = getErrorText(job.error);

  const handleCopy = async () => {
    await copyText(job.jobId);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="text-sm text-slate-500">Job ID</div>
          <div className="break-all font-mono text-sm text-slate-900">{job.jobId}</div>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-xl border px-3 py-1.5 text-sm hover:bg-slate-50"
        >
          Copy
        </button>
      </div>

      <div className="grid gap-2 text-sm text-slate-700 md:grid-cols-2">
        <div>
          <span className="text-slate-500">Status:</span> {normalizedStatus}
        </div>
        <div>
          <span className="text-slate-500">Provider:</span> {job.provider ?? '-'}
        </div>
        <div>
          <span className="text-slate-500">Tool:</span> {job.toolType ?? '-'}
        </div>
        <div>
          <span className="text-slate-500">Updated:</span> {job.updatedAt ?? '-'}
        </div>
      </div>

      {resultUrl ? (
        <div className="mt-4">
          <a
            href={resultUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            Buka hasil
          </a>
          {job.result?.thumbnailUrl ? (
            <img
              src={job.result.thumbnailUrl}
              alt="Preview hasil"
              className="mt-3 max-h-56 rounded-xl border object-cover"
            />
          ) : job.result?.mimeType?.startsWith('image/') ? (
            <img
              src={resultUrl}
              alt="Preview hasil"
              className="mt-3 max-h-56 rounded-xl border object-cover"
            />
          ) : null}
        </div>
      ) : null}

      {errorText ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {errorText}
        </div>
      ) : null}

      {onRefresh ? (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => onRefresh(job.jobId)}
            className="rounded-xl bg-slate-900 px-3 py-2 text-sm text-white hover:opacity-90"
          >
            Refresh status
          </button>
        </div>
      ) : null}
    </div>
  );
}
