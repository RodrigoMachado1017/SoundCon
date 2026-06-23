import { supabase, isSupabaseConfigured } from "./supabase";

// Cliente de API centralizado. A base é configurável por ambiente
// (VITE_API_BASE); cai para localhost:3001 em desenvolvimento.
export const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

// Cabeçalho Authorization com o JWT da sessão Supabase (quando há sessão).
async function authHeaders() {
  if (!isSupabaseConfigured) return {};
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Monta a URL absoluta de um recurso servido pelo backend (ex.: /output/arquivo.mp3).
export function fileUrl(pathname) {
  if (!pathname) return "";
  if (/^https?:\/\//i.test(pathname)) return pathname;
  return `${API_BASE}${pathname}`;
}

// Lê o corpo como JSON de forma tolerante (respostas vazias/não-JSON viram {}).
async function parseJson(resp) {
  try {
    return await resp.json();
  } catch {
    return {};
  }
}

// POST /audio/convert — envia o arquivo + parâmetros e devolve { ok, status, data }.
// `data.error` carrega a mensagem do backend em caso de falha.
export async function convertAudio({ file, format, pitchCents = 0, sampleRate, bitrate, bitDepth, threadId }) {
  const form = new FormData();
  form.append("file", file);
  form.append("format", format);
  form.append("pitchCents", String(pitchCents));
  if (sampleRate) form.append("sampleRate", String(sampleRate));
  if (bitrate) form.append("bitrate", String(bitrate));
  if (bitDepth) form.append("bitDepth", String(bitDepth));
  if (threadId) form.append("thread_id", threadId);

  const resp = await fetch(`${API_BASE}/audio/convert`, {
    method: "POST",
    body: form,
    headers: await authHeaders(),
  });

  const data = await parseJson(resp);
  return { ok: resp.ok, status: resp.status, data };
}

// GET /audio/effects — catálogo de efeitos disponíveis (server-authoritative).
export async function getEffects() {
  const resp = await fetch(`${API_BASE}/audio/effects`);
  const data = await parseJson(resp);
  return data.effects || [];
}

// POST /audio/mix — envia arquivos + projeto serializado e devolve { ok, data }.
export async function mixProject({ files, project, format }) {
  const form = new FormData();
  files.forEach((f) => form.append("files", f));
  form.append("project", JSON.stringify(project));
  form.append("format", format);

  const resp = await fetch(`${API_BASE}/audio/mix`, {
    method: "POST",
    body: form,
    headers: await authHeaders(),
  });
  const data = await parseJson(resp);
  return { ok: resp.ok, status: resp.status, data };
}

// GET /me — perfil do usuário autenticado.
export async function getProfile() {
  const resp = await fetch(`${API_BASE}/me`, { headers: await authHeaders() });
  const data = await parseJson(resp);
  return { ok: resp.ok, status: resp.status, data };
}

// PUT /me — atualiza o nome do perfil.
export async function updateProfile({ nome }) {
  const resp = await fetch(`${API_BASE}/me`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify({ nome }),
  });
  const data = await parseJson(resp);
  return { ok: resp.ok, status: resp.status, data };
}
