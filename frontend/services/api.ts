// services/api.ts
import type { ToolType, ApiJobResponse, UploadSignResponse } from "../types";

const API_BASE_URL_FALLBACK = "https://ugc8s-api-737228170928.asia-southeast1.run.app";
const DEFAULT_TOKEN = "";

function getApiBaseUrl(): string {
  try {
    const ls = localStorage.getItem("ugc8s_api_base_url");
    if (ls && /^https?:\/\//.test(ls)) return ls;
  } catch {
    // ignore
  }

  const vite =
    (import.meta as any)?.env?.VITE_API_BASE_URL ||
    (import.meta as any)?.env?.API_BASE_URL ||
    "";

  return vite || API_BASE_URL_FALLBACK;
}

function isFormData(x: any): x is FormData {
  return typeof FormData !== "undefined" && x instanceof FormData;
}

function normalizeToken(x: any): string {
  return typeof x === "string" ? x : DEFAULT_TOKEN;
}

function coerceValue(v: FormDataEntryValue): any {
  if (typeof v !== "string") return v;
  const s = v.trim();
  if (s === "true") return true;
  if (s === "false") return false;
  return v;
}

function formDataToJson(formData: FormData): Record<string, any> {
  const obj: Record<string, any> = {};
  for (const [k, v] of formData.entries()) {
    if (v instanceof File) continue;
    const value = coerceValue(v);
    if (obj[k] === undefined) obj[k] = value;
    else if (Array.isArray(obj[k])) obj[k].push(value);
    else obj[k] = [obj[k], value];
  }
  return obj;
}

function authHeader(token: string) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function readJsonOrText(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return { ok: false, error: text || "Non-JSON response" };
  }
}

function pickErrorMessage(data: any): string {
  const e = data?.error;
  if (!e) return JSON.stringify(data);
  if (typeof e === "string") return e;
  if (typeof e?.message === "string") return e.message;
  return JSON.stringify(e);
}

/** REQUIRED EXPORT */
export async function signUpload(
  args: { jobId: string; kind: string; filename: string; contentType: string },
  token: string = DEFAULT_TOKEN
): Promise<UploadSignResponse> {
  const API_BASE_URL = getApiBaseUrl();

  const res = await fetch(`${API_BASE_URL}/uploads/sign`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader(token) },
    body: JSON.stringify(args),
  });

  const data: any = await readJsonOrText(res);
  if (!res.ok) throw new Error(`API Error (${res.status}): ${pickErrorMessage(data)}`);
  return data as UploadSignResponse;
}

export async function putToSignedUrl(uploadUrl: string, file: File, contentType?: string) {
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: contentType ? { "Content-Type": contentType } : undefined,
    body: file,
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Upload failed (${res.status}): ${t || res.statusText}`);
  }
  return true;
}

/**
 * generateMedia tahan rollback/ketuker argumen:
 * - generateMedia(toolType, formData, token)
 * - generateMedia(toolType, token, formData)
 * - generateMedia(toolType, payloadObject, token)
 */
export async function generateMedia(
  toolType: ToolType,
  a: FormData | Record<string, any> | string,
  b?: FormData | Record<string, any> | string
): Promise<ApiJobResponse> {
  const API_BASE_URL = getApiBaseUrl();

  let token = DEFAULT_TOKEN;
  let payload: Record<string, any> = {};

  if (isFormData(a)) {
    payload = formDataToJson(a);
    token = normalizeToken(b);
  } else if (typeof a === "string") {
    token = normalizeToken(a);
    if (isFormData(b)) payload = formDataToJson(b);
    else if (b && typeof b === "object") payload = b as Record<string, any>;
    else payload = {};
  } else if (a && typeof a === "object") {
    payload = a as Record<string, any>;
    token = normalizeToken(b);
  }

  const endpoint = (toolType as any) === "VIDEO_VEO" ? "/generate/veo" : "/generate/nano";
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader(token) },
    body: JSON.stringify(payload),
  });

  const data: any = await readJsonOrText(res);
  if (!res.ok) throw new Error(`API Error (${res.status}): ${pickErrorMessage(data)}`);
  return data as ApiJobResponse;
}

export async function getJobStatus(jobId: string, token: string = DEFAULT_TOKEN): Promise<ApiJobResponse> {
  const API_BASE_URL = getApiBaseUrl();

  const res = await fetch(`${API_BASE_URL}/jobs/${encodeURIComponent(jobId)}`, {
    method: "GET",
    headers: { ...authHeader(token) },
  });

  const data: any = await readJsonOrText(res);
  if (!res.ok) throw new Error(`API Error (${res.status}): ${pickErrorMessage(data)}`);
  return data as ApiJobResponse;
}

export function setApiBaseUrlForThisBrowser(url: string) {
  localStorage.setItem("ugc8s_api_base_url", url);
}