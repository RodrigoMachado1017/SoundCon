const { spawnSync } = require("child_process");
const { CATALOG, CATALOG_BY_TYPE } = require("./effectCatalog");

// ---- Disponibilidade de filtros no build do FFmpeg ---------------------
let availableFilters = null;

function loadAvailableFilters(ffmpegPath) {
  const result = spawnSync(ffmpegPath, ["-hide_banner", "-filters"], { encoding: "utf8" });
  const text = `${result.stdout || ""}`;
  const set = new Set();
  // Linhas no formato: " T.. name  A->A  descrição"
  for (const line of text.split("\n")) {
    const m = line.trim().match(/^[A-Z.]{3}\s+([A-Za-z0-9_]+)\s/);
    if (m) set.add(m[1]);
  }
  return set;
}

function initFilters(ffmpegPath) {
  availableFilters = loadAvailableFilters(ffmpegPath);
  return availableFilters;
}

function isEffectAvailable(effect) {
  if (!availableFilters) return true; // sem detecção, assume disponível
  return availableFilters.has(effect.requiresFilter);
}

// Catálogo público (sem as funções build) para o frontend montar a UI.
function getPublicCatalog() {
  return CATALOG.filter(isEffectAvailable).map((e) => ({
    type: e.type,
    label: e.label,
    group: e.group,
    previewMode: e.previewMode,
    freqs: e.freqs || null,
    params: e.params,
  }));
}

// ---- Clamp/validação de parâmetros -------------------------------------
function clampParam(spec, raw) {
  const n = Number(raw);
  const value = Number.isFinite(n) ? n : spec.def;
  return Math.min(spec.max, Math.max(spec.min, value));
}

function resolveEffectParams(effect, rawParams = {}) {
  const out = {};
  for (const spec of effect.params) {
    out[spec.key] = clampParam(spec, rawParams[spec.key]);
  }
  return out;
}

// Constrói a cadeia de filtros de uma faixa: FX habilitados + ganho + pan.
function buildTrackChain(track) {
  const parts = [];

  for (const fx of track.fx || []) {
    if (fx.enabled === false) continue;
    const effect = CATALOG_BY_TYPE.get(fx.type);
    if (!effect || !isEffectAvailable(effect)) continue;
    const params = resolveEffectParams(effect, fx.params);
    parts.push(effect.build(params));
  }

  // Ganho da faixa (sempre presente => garante que o label tenha conteúdo).
  parts.push(`volume=${track.gainDb}dB`);

  // Pan (balanço estéreo): p em [-1,1].
  const p = track.pan;
  const lg = p <= 0 ? 1 : 1 - p;
  const rg = p >= 0 ? 1 : 1 + p;
  parts.push(`pan=stereo|c0=${lg.toFixed(4)}*c0|c1=${rg.toFixed(4)}*c1`);

  return parts.join(",");
}

// Monta o -filter_complex completo: cadeia por faixa, amix no master e limiter.
function buildFilterComplex(project) {
  const { tracks, master } = project;
  const chains = [];
  const labels = [];

  tracks.forEach((track, i) => {
    const chain = buildTrackChain(track);
    // Input pelo índice do arquivo enviado; output rotulado pela ordem da faixa.
    chains.push(`[${track.fileIndex}:a]${chain}[a${i}]`);
    labels.push(`[a${i}]`);
  });

  let masterIn;
  if (tracks.length > 1) {
    // amix divide a soma por N (e o build atual não suporta normalize); compensa-se
    // com volume=N para preservar os ganhos por faixa. O limiter do master segura picos.
    const n = tracks.length;
    chains.push(`${labels.join("")}amix=inputs=${n},volume=${n}[mix]`);
    masterIn = "[mix]";
  } else {
    masterIn = "[a0]";
  }

  const masterParts = [`volume=${master.gainDb}dB`];
  if (master.limiter) masterParts.push("alimiter=limit=0.98");
  chains.push(`${masterIn}${masterParts.join(",")}[out]`);

  return chains.join(";");
}

// Valida e normaliza o payload recebido do frontend.
const MAX_TRACKS = 16;

function parseMixRequest(rawProject, fileCount) {
  let project = rawProject;
  if (typeof rawProject === "string") {
    try {
      project = JSON.parse(rawProject);
    } catch {
      const err = new Error("Projeto inválido (JSON malformado).");
      err.statusCode = 400;
      throw err;
    }
  }

  if (!project || !Array.isArray(project.tracks) || project.tracks.length === 0) {
    const err = new Error("Projeto deve conter ao menos uma faixa.");
    err.statusCode = 400;
    throw err;
  }

  if (project.tracks.length > MAX_TRACKS) {
    const err = new Error(`Máximo de ${MAX_TRACKS} faixas por mixagem.`);
    err.statusCode = 422;
    throw err;
  }

  const clampDb = (v, def) => Math.min(24, Math.max(-60, Number.isFinite(Number(v)) ? Number(v) : def));
  const clampPan = (v) => Math.min(1, Math.max(-1, Number.isFinite(Number(v)) ? Number(v) : 0));

  const tracks = project.tracks.map((t, i) => {
    const fileIndex = Number.isInteger(t.fileIndex) ? t.fileIndex : i;
    if (fileIndex < 0 || fileIndex >= fileCount) {
      const err = new Error(`Faixa ${i} referencia arquivo inexistente.`);
      err.statusCode = 400;
      throw err;
    }
    return {
      fileIndex,
      gainDb: clampDb(t.gainDb, 0),
      pan: clampPan(t.pan),
      fx: Array.isArray(t.fx) ? t.fx : [],
    };
  });

  return {
    tracks,
    master: {
      gainDb: clampDb(project.master?.gainDb, 0),
      limiter: project.master?.limiter !== false, // limiter no master por padrão
    },
  };
}

module.exports = {
  initFilters,
  getPublicCatalog,
  isEffectAvailable,
  buildTrackChain,
  buildFilterComplex,
  parseMixRequest,
  resolveEffectParams,
  MAX_TRACKS,
};
