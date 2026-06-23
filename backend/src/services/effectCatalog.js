// Catálogo de efeitos de áudio: fonte única da verdade dos parâmetros e dos
// construtores de filtro FFmpeg. O frontend consome o schema via GET /audio/effects
// (sem as funções build) e mapeia cada tipo para nós Web Audio no preview ao vivo.
//
// previewMode:
//   "exact"  -> Web Audio reproduz fielmente (BiquadFilter/Gain/Panner...)
//   "approx" -> Web Audio aproxima (compressor/limiter/superequalizer...)
//   "export" -> sem preview ao vivo; só aplicado no render FFmpeg

const toLinFromDb = (db) => 10 ** (db / 20);

// Frequências dos bancos de EQ (Hz).
const EQ10_FREQS = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
const SUPEREQ_FREQS = [
  65, 92, 131, 185, 262, 370, 523, 740, 1047, 1480, 2093, 2960, 4186, 5920, 8372, 11840, 16744, 20000,
];
const FIREQ_FREQS = [60, 250, 1000, 4000, 8000, 16000];

// Escapa um valor para uso literal dentro de um filtergraph FFmpeg.
function esc(value) {
  return String(value).replace(/[\\',;:=\[\]]/g, (c) => `\\${c}`);
}

function band(prefix, count, { min, max, step, def, unit, label }) {
  return Array.from({ length: count }, (_, i) => ({
    key: `${prefix}${i}`,
    label: `${label} ${i + 1}`,
    min,
    max,
    step,
    def,
    unit,
  }));
}

const CATALOG = [
  // ---------------------------------------------------------------- Filtros
  {
    type: "highpass",
    label: "High-pass",
    group: "Filtros",
    previewMode: "exact",
    requiresFilter: "highpass",
    params: [
      { key: "f", label: "Frequência", min: 20, max: 2000, step: 1, def: 80, unit: "Hz" },
      { key: "poles", label: "Polos", min: 1, max: 2, step: 1, def: 2, unit: "" },
    ],
    build: (p) => `highpass=f=${p.f}:p=${p.poles}`,
  },
  {
    type: "lowpass",
    label: "Low-pass",
    group: "Filtros",
    previewMode: "exact",
    requiresFilter: "lowpass",
    params: [
      { key: "f", label: "Frequência", min: 200, max: 20000, step: 10, def: 12000, unit: "Hz" },
      { key: "poles", label: "Polos", min: 1, max: 2, step: 1, def: 2, unit: "" },
    ],
    build: (p) => `lowpass=f=${p.f}:p=${p.poles}`,
  },
  {
    type: "bandpass",
    label: "Band-pass",
    group: "Filtros",
    previewMode: "exact",
    requiresFilter: "bandpass",
    params: [
      { key: "f", label: "Frequência", min: 20, max: 20000, step: 10, def: 1000, unit: "Hz" },
      { key: "w", label: "Largura (Q)", min: 0.05, max: 5, step: 0.05, def: 0.5, unit: "Q" },
    ],
    build: (p) => `bandpass=f=${p.f}:width_type=q:w=${p.w}`,
  },
  {
    type: "bandreject",
    label: "Band-reject",
    group: "Filtros",
    previewMode: "exact",
    requiresFilter: "bandreject",
    params: [
      { key: "f", label: "Frequência", min: 20, max: 20000, step: 10, def: 1000, unit: "Hz" },
      { key: "w", label: "Largura (Q)", min: 0.05, max: 5, step: 0.05, def: 0.5, unit: "Q" },
    ],
    build: (p) => `bandreject=f=${p.f}:width_type=q:w=${p.w}`,
  },

  // ---------------------------------------------------------------- EQ
  {
    type: "equalizer10",
    label: "Equalizador 10 bandas",
    group: "EQ",
    previewMode: "exact",
    requiresFilter: "equalizer",
    freqs: EQ10_FREQS,
    params: band("g", 10, { min: -15, max: 15, step: 0.5, def: 0, unit: "dB", label: "Banda" }),
    build: (p) =>
      EQ10_FREQS.map((f, i) => `equalizer=f=${f}:width_type=o:w=1:g=${p[`g${i}`]}`).join(","),
  },
  {
    type: "superequalizer",
    label: "Super EQ 18 bandas",
    group: "EQ",
    previewMode: "approx",
    requiresFilter: "superequalizer",
    freqs: SUPEREQ_FREQS,
    params: band("b", 18, { min: 0, max: 20, step: 0.1, def: 1, unit: "x", label: "Banda" }),
    build: (p) =>
      `superequalizer=${SUPEREQ_FREQS.map((_, i) => `${i + 1}b=${p[`b${i}`]}`).join(":")}`,
  },
  {
    type: "bass",
    label: "Graves (shelf)",
    group: "EQ",
    previewMode: "exact",
    requiresFilter: "bass",
    params: [
      { key: "g", label: "Ganho", min: -20, max: 20, step: 0.5, def: 0, unit: "dB" },
      { key: "f", label: "Frequência", min: 40, max: 500, step: 1, def: 100, unit: "Hz" },
      { key: "w", label: "Largura", min: 0.1, max: 2, step: 0.05, def: 0.5, unit: "" },
    ],
    build: (p) => `bass=g=${p.g}:f=${p.f}:width_type=q:w=${p.w}`,
  },
  {
    type: "treble",
    label: "Agudos (shelf)",
    group: "EQ",
    previewMode: "exact",
    requiresFilter: "treble",
    params: [
      { key: "g", label: "Ganho", min: -20, max: 20, step: 0.5, def: 0, unit: "dB" },
      { key: "f", label: "Frequência", min: 2000, max: 12000, step: 50, def: 3000, unit: "Hz" },
      { key: "w", label: "Largura", min: 0.1, max: 2, step: 0.05, def: 0.5, unit: "" },
    ],
    build: (p) => `treble=g=${p.g}:f=${p.f}:width_type=q:w=${p.w}`,
  },
  {
    type: "firequalizer",
    label: "FIR EQ (curva)",
    group: "EQ",
    previewMode: "export",
    requiresFilter: "firequalizer",
    freqs: FIREQ_FREQS,
    params: FIREQ_FREQS.map((f, i) => ({
      key: `g${i}`,
      label: `${f} Hz`,
      min: -20,
      max: 20,
      step: 0.5,
      def: 0,
      unit: "dB",
    })),
    build: (p) => {
      const entries = FIREQ_FREQS.map((f, i) => `entry(${f},${p[`g${i}`]})`).join(";");
      return `firequalizer=gain_entry=${esc(entries)}`;
    },
  },

  // ---------------------------------------------------------------- Dinâmica
  {
    type: "acompressor",
    label: "Compressor",
    group: "Dinâmica",
    previewMode: "approx",
    requiresFilter: "acompressor",
    params: [
      { key: "thresholdDb", label: "Threshold", min: -60, max: 0, step: 1, def: -18, unit: "dB" },
      { key: "ratio", label: "Ratio", min: 1, max: 20, step: 0.5, def: 4, unit: ":1" },
      { key: "attack", label: "Attack", min: 1, max: 200, step: 1, def: 20, unit: "ms" },
      { key: "release", label: "Release", min: 10, max: 1000, step: 10, def: 250, unit: "ms" },
      { key: "makeupDb", label: "Makeup", min: 0, max: 24, step: 1, def: 0, unit: "dB" },
      { key: "knee", label: "Knee", min: 1, max: 8, step: 0.5, def: 2.8, unit: "" },
    ],
    build: (p) =>
      `acompressor=threshold=${toLinFromDb(p.thresholdDb).toFixed(6)}:ratio=${p.ratio}:attack=${p.attack}:release=${p.release}:makeup=${toLinFromDb(p.makeupDb).toFixed(6)}:knee=${p.knee}`,
  },
  {
    type: "alimiter",
    label: "Limitador",
    group: "Dinâmica",
    previewMode: "approx",
    requiresFilter: "alimiter",
    params: [
      { key: "limitDb", label: "Limite", min: -12, max: 0, step: 0.5, def: -1, unit: "dB" },
      { key: "attack", label: "Attack", min: 0.1, max: 80, step: 0.1, def: 5, unit: "ms" },
      { key: "release", label: "Release", min: 1, max: 8000, step: 1, def: 50, unit: "ms" },
    ],
    build: (p) =>
      `alimiter=limit=${toLinFromDb(p.limitDb).toFixed(6)}:attack=${p.attack}:release=${p.release}`,
  },
  {
    type: "dynaudnorm",
    label: "Normalização dinâmica",
    group: "Dinâmica",
    previewMode: "export",
    requiresFilter: "dynaudnorm",
    params: [
      { key: "f", label: "Frame", min: 10, max: 8000, step: 10, def: 500, unit: "ms" },
      { key: "g", label: "Filtro", min: 3, max: 301, step: 2, def: 31, unit: "" },
      { key: "m", label: "Ganho máx.", min: 1, max: 100, step: 1, def: 10, unit: "x" },
      { key: "p", label: "Pico", min: 0, max: 1, step: 0.01, def: 0.95, unit: "" },
    ],
    build: (p) => `dynaudnorm=f=${p.f}:g=${p.g}:m=${p.m}:p=${p.p}`,
  },
  {
    type: "loudnorm",
    label: "Loudness (EBU R128)",
    group: "Dinâmica",
    previewMode: "export",
    requiresFilter: "loudnorm",
    params: [
      { key: "I", label: "Loudness alvo", min: -70, max: -5, step: 1, def: -16, unit: "LUFS" },
      { key: "TP", label: "True peak", min: -9, max: 0, step: 0.5, def: -1.5, unit: "dBTP" },
      { key: "LRA", label: "Faixa (LRA)", min: 1, max: 20, step: 1, def: 11, unit: "LU" },
    ],
    build: (p) => `loudnorm=I=${p.I}:TP=${p.TP}:LRA=${p.LRA}`,
  },
  {
    type: "volume",
    label: "Ganho (volume)",
    group: "Dinâmica",
    previewMode: "exact",
    requiresFilter: "volume",
    params: [{ key: "gainDb", label: "Ganho", min: -30, max: 30, step: 0.5, def: 0, unit: "dB" }],
    build: (p) => `volume=${p.gainDb}dB`,
  },

  // ---------------------------------------------------------------- Estéreo/Realce
  {
    type: "crystalizer",
    label: "Crystalizer (clareza)",
    group: "Realce",
    previewMode: "export",
    requiresFilter: "crystalizer",
    params: [{ key: "i", label: "Intensidade", min: 0, max: 10, step: 0.1, def: 2, unit: "" }],
    build: (p) => `crystalizer=i=${p.i}`,
  },
  {
    type: "stereowiden",
    label: "Largura estéreo",
    group: "Realce",
    previewMode: "export",
    requiresFilter: "stereotools",
    params: [{ key: "slev", label: "Lateral (S)", min: 0, max: 4, step: 0.05, def: 1, unit: "x" }],
    build: (p) => `stereotools=slev=${p.slev}`,
  },
  {
    type: "crossfeed",
    label: "Crossfeed (fones)",
    group: "Realce",
    previewMode: "export",
    requiresFilter: "crossfeed",
    params: [
      { key: "strength", label: "Força", min: 0, max: 1, step: 0.05, def: 0.2, unit: "" },
      { key: "range", label: "Amplitude", min: 0, max: 1, step: 0.05, def: 0.5, unit: "" },
    ],
    build: (p) => `crossfeed=strength=${p.strength}:range=${p.range}`,
  },
];

const CATALOG_BY_TYPE = new Map(CATALOG.map((e) => [e.type, e]));

module.exports = {
  CATALOG,
  CATALOG_BY_TYPE,
  EQ10_FREQS,
  SUPEREQ_FREQS,
  FIREQ_FREQS,
  esc,
  toLinFromDb,
};
