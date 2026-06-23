const { spawnSync } = require("child_process");

const ALLOWED_FORMATS = ["mp3", "wav", "ogg", "aac", "flac", "m4a", "opus"];
const MAX_ABS_CENTS = 900;
const RECOMMENDED_RANGE_CENTS = [-300, 300];

const ALLOWED_SAMPLE_RATES = [44100, 48000, 96000];
const ALLOWED_BITRATES_KBPS = [96, 128, 160, 192, 256, 320];
const ALLOWED_BIT_DEPTHS = [16, 24, 32];
const DEFAULT_SAMPLE_RATE = 44100;

// Formatos com compressão com perdas aceitam bitrate; formatos PCM/lossless aceitam bit depth.
const LOSSY_FORMATS = ["mp3", "aac", "ogg", "opus", "m4a"];
const BITDEPTH_FORMATS = ["wav", "flac"];

function parsePitchCents(rawValue) {
  if (rawValue === undefined || rawValue === null || rawValue === "") {
    return 0;
  }

  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
    throw new Error("pitchCents deve ser um número inteiro em cents.");
  }

  return parsed;
}

function validateOutputFormat(rawFormat) {
  const normalized = String(rawFormat || "mp3").toLowerCase();
  if (!ALLOWED_FORMATS.includes(normalized)) {
    throw new Error("Formato de saída inválido. Use: mp3, wav, ogg, aac, flac, m4a ou opus.");
  }
  return normalized;
}

function calculatePitchRatio(cents) {
  return 2 ** (cents / 1200);
}

function parseSampleRate(raw) {
  if (raw === undefined || raw === null || raw === "") return DEFAULT_SAMPLE_RATE;
  const n = Number(raw);
  if (!ALLOWED_SAMPLE_RATES.includes(n)) {
    throw new Error("Sample rate inválido. Use: 44100, 48000 ou 96000.");
  }
  return n;
}

// Monta os argumentos de codec/qualidade conforme o formato de saída.
// `quality` = { bitrate (kbps), bitDepth (16/24/32) }. Valores inválidos são ignorados (defaults do FFmpeg).
function buildQualityArgs(format, quality = {}) {
  const args = [];

  if (LOSSY_FORMATS.includes(format)) {
    const kbps = Number(quality.bitrate);
    if (ALLOWED_BITRATES_KBPS.includes(kbps)) {
      args.push("-b:a", `${kbps}k`);
    }
    return args;
  }

  if (BITDEPTH_FORMATS.includes(format)) {
    const depth = Number(quality.bitDepth);
    if (!ALLOWED_BIT_DEPTHS.includes(depth)) return args;

    if (format === "wav") {
      const codec = depth === 16 ? "pcm_s16le" : depth === 24 ? "pcm_s24le" : "pcm_s32le";
      args.push("-c:a", codec);
    } else {
      // flac: profundidade via sample_fmt (s16 ou s32) + bits_per_raw_sample p/ 24-bit.
      args.push("-sample_fmt", depth === 16 ? "s16" : "s32");
      if (depth === 24) args.push("-bits_per_raw_sample", "24");
    }
  }

  return args;
}

function classifyQualityByCents(cents) {
  const absCents = Math.abs(cents);

  if (absCents > MAX_ABS_CENTS) {
    throw new Error(`Intervalo máximo permitido é ±${MAX_ABS_CENTS} cents.`);
  }

  if (absCents <= 300) {
    return {
      level: "safe",
      warning: null,
      recommendedRangeCents: RECOMMENDED_RANGE_CENTS,
    };
  }

  if (absCents <= 600) {
    return {
      level: "caution",
      warning:
        "Você está fora da faixa recomendada. Pode ocorrer perda moderada de qualidade dependendo do material.",
      recommendedRangeCents: RECOMMENDED_RANGE_CENTS,
    };
  }

  return {
    level: "high_risk",
    warning:
      "Alteração extrema de tonalidade. Há alto risco de artefatos audíveis e degradação de qualidade.",
    recommendedRangeCents: RECOMMENDED_RANGE_CENTS,
  };
}

function detectPitchEngine(ffmpegPath) {
  const result = spawnSync(ffmpegPath, ["-hide_banner", "-filters"], {
    encoding: "utf8",
  });
  const output = `${result.stdout || ""}\n${result.stderr || ""}`;

  if (result.status === 0 && /\brubberband\b/i.test(output)) {
    return "rubberband";
  }

  return "fallback";
}

function buildPitchFilter({ pitchCents, engine, sampleRate = 44100 }) {
  const ratio = calculatePitchRatio(pitchCents);

  if (pitchCents === 0) {
    return `aformat=sample_fmts=fltp,aresample=${sampleRate}`;
  }

  if (engine === "rubberband") {
    return `aformat=sample_fmts=fltp,rubberband=pitch=${ratio}:formant=preserved,aresample=${sampleRate}:resampler=soxr:precision=28:dither_method=triangular_hp`;
  }

  const adjustedRate = Math.max(1, Math.round(sampleRate * ratio));
  const tempoCorrection = 1 / ratio;

  return `aformat=sample_fmts=fltp,asetrate=${adjustedRate},aresample=${sampleRate}:resampler=soxr:precision=28:dither_method=triangular_hp,atempo=${tempoCorrection}`;
}

module.exports = {
  ALLOWED_FORMATS,
  MAX_ABS_CENTS,
  RECOMMENDED_RANGE_CENTS,
  ALLOWED_SAMPLE_RATES,
  ALLOWED_BITRATES_KBPS,
  ALLOWED_BIT_DEPTHS,
  DEFAULT_SAMPLE_RATE,
  LOSSY_FORMATS,
  BITDEPTH_FORMATS,
  calculatePitchRatio,
  classifyQualityByCents,
  parsePitchCents,
  parseSampleRate,
  buildQualityArgs,
  validateOutputFormat,
  detectPitchEngine,
  buildPitchFilter,
};
