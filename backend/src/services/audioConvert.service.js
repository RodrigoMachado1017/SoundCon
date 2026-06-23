const path = require("path");

const { outputDir } = require("../config/paths");
const { detectedPitchEngine } = require("../config/ffmpeg");
const { runFfmpeg } = require("../utils/runFfmpeg");
const { safeUnlink } = require("../utils/safeUnlink");
const {
  buildPitchFilter,
  buildQualityArgs,
  calculatePitchRatio,
  classifyQualityByCents,
  parsePitchCents,
  parseSampleRate,
  validateOutputFormat,
} = require("./audioProcessing.service");

// Orquestra a conversão de um arquivo: valida entrada, monta o filtro de pitch,
// roda o FFmpeg e devolve metadados. Erros de validação são lançados antes de
// criar o arquivo de saída; falhas de FFmpeg limpam o próprio output.
async function convertAudio({ inputPath, format, pitchCentsRaw, sampleRateRaw, bitrate, bitDepth }) {
  const outputFormat = validateOutputFormat(format);
  const pitchCents = parsePitchCents(pitchCentsRaw);
  const sampleRate = parseSampleRate(sampleRateRaw);
  const quality = classifyQualityByCents(pitchCents);
  const ratio = calculatePitchRatio(pitchCents);

  const outputFile = `${Date.now()}-${Math.random().toString(16).slice(2, 10)}.${outputFormat}`;
  const outputPath = path.join(outputDir, outputFile);

  const filterGraph = buildPitchFilter({
    pitchCents,
    engine: detectedPitchEngine,
    sampleRate,
  });

  const qualityArgs = buildQualityArgs(outputFormat, { bitrate, bitDepth });

  const startedAt = Date.now();
  try {
    await runFfmpeg([
      "-hide_banner",
      "-y",
      "-i",
      inputPath,
      "-vn",
      "-af",
      filterGraph,
      "-ar",
      String(sampleRate),
      ...qualityArgs,
      outputPath,
    ]);
  } catch (err) {
    safeUnlink(outputPath);
    throw err;
  }
  const durationMs = Date.now() - startedAt;

  return {
    outputFile,
    outputPath,
    pitchCents,
    ratio,
    quality,
    sampleRate,
    engine: detectedPitchEngine,
    durationMs,
  };
}

module.exports = { convertAudio };
