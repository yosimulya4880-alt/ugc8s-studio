import type { ApiJob } from '../types';

export const DEFAULT_API_BASE_URL = (import.meta as any)?.env?.VITE_API_BASE_URL?.replace(/\/$/, '') || '';

function authHeader(token?: string): HeadersInit {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getJob(jobId: string, token?: string, apiBaseUrl = DEFAULT_API_BASE_URL): Promise<ApiJob> {
  if (!jobId) throw new Error('jobId wajib diisi');
  if (!apiBaseUrl) throw new Error('API base URL belum dikonfigurasi');

  const res = await fetch(`${apiBaseUrl}/jobs/${encodeURIComponent(jobId)}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...authHeader(token),
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || data?.message || `Gagal mengambil detail job (${res.status})`);
  }

  return data as ApiJob;
}
