import type {
  GenerateMediaResponse,
  SignedUploadRequest,
  SignedUploadResponse,
  ToolType,
} from '../types';
const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

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


function requireApiBase(): string {
  if (!API_BASE) {
    throw new Error('VITE_API_BASE_URL belum diset.');
  }
  return API_BASE;
}

function authHeader(token?: string): HeadersInit {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function isFormData(value: unknown): value is FormData {
  return typeof FormData !== 'undefined' && value instanceof FormData;
}

function normalizeGenerateArgs(
  arg2?: FormData | string,
  arg3?: FormData | string,
): { formData: FormData; token?: string } {
  if (isFormData(arg2)) {
    return {
      formData: arg2,
      token: typeof arg3 === 'string' ? arg3 : undefined,
    };
  }

  if (isFormData(arg3)) {
    return {
      formData: arg3,
      token: typeof arg2 === 'string' ? arg2 : undefined,
    };
  }

  throw new Error(
    'generateMedia butuh FormData. Pola valid: (toolType, formData, token) atau (toolType, token, formData).',
  );
}


function formDataToVeoJson(formData: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const refs: string[] = [];

  formData.forEach((value, key) => {
    if (key === 'referenceImageGcsPaths' || key === 'referenceImageGcsPath') {
      if (typeof value === 'string' && value) refs.push(value);
      return;
    }

    if (key === 'mock') {
      const v = typeof value === 'string' ? value : '';
      out[key] = v === 'true' || v === '1';
      return;
    }

    if (key === 'durationSeconds') {
      const v = typeof value === 'string' ? Number(value) : NaN;
      out[key] = Number.isFinite(v) ? v : value;
      return;
    }

    // files are uploaded separately via signed URLs
    if (value instanceof File || value instanceof Blob) return;

    out[key] = value;
  });

  if (refs.length) out.referenceImageGcsPaths = refs;

  return out;
}

async function parseJsonSafe<T>(response: Response): Promise<T | null> {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

async function throwApiError(response: Response): Promise<never> {
  const body = await parseJsonSafe<{ error?: unknown; message?: string }>(response);
  const detail =
    (typeof body?.error === 'string' && body.error) ||
    body?.message ||
    `Request gagal (${response.status} ${response.statusText})`;

  throw new Error(detail);
}

export async function signUpload(
  payload: SignedUploadRequest,
  token?: string,
): Promise<SignedUploadResponse> {
  const apiBase = requireApiBase();

  const response = await fetch(`${apiBase}/uploads/sign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(token),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    await throwApiError(response);
  }

  const data = await parseJsonSafe<SignedUploadResponse>(response);
  if (!data?.uploadUrl) {
    throw new Error('Response /uploads/sign tidak mengandung uploadUrl.');
  }

  return data;
}

export async function uploadFileToSignedUrl(
  uploadUrl: string,
  file: File | Blob,
  contentType?: string,
  extraHeaders?: Record<string, string>,
): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType ?? (file instanceof File ? file.type : 'application/octet-stream'),
      ...(extraHeaders ?? {}),
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error(`Upload ke signed URL gagal (${response.status} ${response.statusText}).`);
  }
}

export async function generateMedia(
  toolType: ToolType,
  arg2?: FormData | string,
  arg3?: FormData | string,
): Promise<GenerateMediaResponse> {
  const apiBase = requireApiBase();
  const { formData, token } = normalizeGenerateArgs(arg2, arg3);

  const isNano = toolType === 'nano';
  const endpoint = isNano ? '/generate/nano' : '/generate/veo';

  const response = await fetch(`${apiBase}${endpoint}`, {
    method: 'POST',
    headers: {
      ...(isNano ? {} : { 'Content-Type': 'application/json' }),
      ...authHeader(token),
    },
    body: isNano ? formData : JSON.stringify(formDataToVeoJson(formData)),
  });

  if (!response.ok) {
    await throwApiError(response);
  }

  const data = await parseJsonSafe<GenerateMediaResponse>(response);
  if (!data?.jobId) {
    throw new Error('Response generateMedia tidak mengandung jobId.');
  }

  return {
    ...data,
    status: normalizeJobStatus(data.status),
  };
}

export async function getJob(jobId: string, token?: string): Promise<GenerateMediaResponse> {
  const apiBase = requireApiBase();

  const response = await fetch(`${apiBase}/jobs/${encodeURIComponent(jobId)}`, {
    method: 'GET',
    headers: {
      ...authHeader(token),
    },
  });

  if (!response.ok) {
    await throwApiError(response);
  }

  const data = await parseJsonSafe<GenerateMediaResponse>(response);
  if (!data?.jobId) {
    throw new Error('Response /jobs/:id tidak valid.');
  }

  return {
    ...data,
    status: normalizeJobStatus(data.status),
  };
}

export async function healthCheck(): Promise<unknown> {
  const apiBase = requireApiBase();
  const response = await fetch(`${apiBase}/health`);

  if (!response.ok) {
    await throwApiError(response);
  }

  return parseJsonSafe(response);
}
