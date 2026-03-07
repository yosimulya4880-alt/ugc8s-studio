import type { ApiJob } from '../types';

export const DEFAULT_API_BASE_URL = (import.meta as any)?.env?.VITE_API_BASE_URL?.replace(/\/$/, '') || '';

export type SignUploadPayload = {
  filename: string;
  contentType: string;
  kind?: string;
  jobId?: string;
};

export type SignUploadResult = {
  ok?: boolean;
  jobId: string;
  objectPath?: string;
  uploadUrl: string;
  publicUrl?: string;
};

function authHeader(token?: string): HeadersInit {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function resolveArgs<T extends FormData>(arg2?: string | T, arg3?: string | T): { formData: T; token?: string } {
  if (arg2 instanceof FormData) {
    return { formData: arg2 as T, token: typeof arg3 === 'string' ? arg3 : undefined };
  }
  if (arg3 instanceof FormData) {
    return { formData: arg3 as T, token: typeof arg2 === 'string' ? arg2 : undefined };
  }
  throw new Error('FormData tidak ditemukan. Gunakan generateMedia(toolType, formData, token) atau generateMedia(toolType, token, formData).');
}

async function parseJsonSafe(res: Response) {
  return res.json().catch(() => ({}));
}

export async function signUpload(
  payload: SignUploadPayload,
  token?: string,
  apiBaseUrl = DEFAULT_API_BASE_URL,
): Promise<SignUploadResult> {
  if (!apiBaseUrl) throw new Error('API base URL belum dikonfigurasi');

  const res = await fetch(`${apiBaseUrl}/uploads/sign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...authHeader(token),
    },
    body: JSON.stringify(payload),
  });

  const data = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(data?.error || data?.message || `Gagal membuat signed upload (${res.status})`);
  }

  return data as SignUploadResult;
}

export async function uploadToSignedUrl(uploadUrl: string, file: File | Blob, contentType?: string): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: contentType ? { 'Content-Type': contentType } : undefined,
    body: file,
  });

  if (!res.ok) {
    throw new Error(`Gagal upload file ke signed URL (${res.status})`);
  }
}

export async function generateMedia(
  toolType: 'nano' | 'veo',
  arg2?: string | FormData,
  arg3?: string | FormData,
  apiBaseUrl = DEFAULT_API_BASE_URL,
): Promise<ApiJob> {
  if (!apiBaseUrl) throw new Error('API base URL belum dikonfigurasi');

  const { formData, token } = resolveArgs<FormData>(arg2, arg3);
  const endpoint = toolType === 'veo' ? '/generate/veo' : '/generate/nano';

  const res = await fetch(`${apiBaseUrl}${endpoint}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      ...authHeader(token),
    },
    body: formData,
  });

  const data = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(data?.error || data?.message || `Gagal generate ${toolType} (${res.status})`);
  }

  return data as ApiJob;
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

  const data = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(data?.error || data?.message || `Gagal mengambil detail job (${res.status})`);
  }

  return data as ApiJob;
}
