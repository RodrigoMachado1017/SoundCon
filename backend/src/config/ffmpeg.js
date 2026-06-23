const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
const { detectPitchEngine } = require("../services/audioProcessing.service");

const ffmpegPath = ffmpegInstaller.path;

// Detecta uma única vez, na inicialização, se o build do FFmpeg traz o rubberband.
const detectedPitchEngine = detectPitchEngine(ffmpegPath);

// Carrega a lista de filtros disponíveis para o catálogo de efeitos da DAW.
// require atrasado evita ciclo (mixProcessing depende deste módulo? não, mas por garantia).
try {
  // eslint-disable-next-line global-require
  require("../services/mixProcessing.service").initFilters(ffmpegPath);
} catch (err) {
  console.error("Falha ao detectar filtros FFmpeg:", err.message);
}

const DEFAULT_SAMPLE_RATE = 44100;
const CONVERSION_TIMEOUT_MS = 60_000;
const MIX_TIMEOUT_MS = 180_000;

module.exports = {
  ffmpegPath,
  detectedPitchEngine,
  DEFAULT_SAMPLE_RATE,
  CONVERSION_TIMEOUT_MS,
  MIX_TIMEOUT_MS,
};
