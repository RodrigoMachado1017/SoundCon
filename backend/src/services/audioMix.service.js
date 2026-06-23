const path = require("path");

const { outputDir } = require("../config/paths");
const { MIX_TIMEOUT_MS } = require("../config/ffmpeg");
const { runFfmpeg } = require("../utils/runFfmpeg");
const { safeUnlink } = require("../utils/safeUnlink");
const { validateOutputFormat } = require("./audioProcessing.service");
const { parseMixRequest, buildFilterComplex } = require("./mixProcessing.service");

// Renderiza um projeto multitrack: monta o filter_complex e roda o FFmpeg.
// `files` é o array do multer (req.files), na mesma ordem dos fileIndex.
async function mixAudio({ rawProject, rawFormat, files }) {
  const outputFormat = validateOutputFormat(rawFormat);
  const project = parseMixRequest(rawProject, files.length);
  const filterComplex = buildFilterComplex(project);

  const outputFile = `${Date.now()}-${Math.random().toString(16).slice(2, 10)}.${outputFormat}`;
  const outputPath = path.join(outputDir, outputFile);

  // Inputs na ordem em que o multer recebeu os arquivos.
  const inputArgs = [];
  for (const file of files) {
    inputArgs.push("-i", file.path);
  }

  const args = [
    "-hide_banner",
    "-y",
    ...inputArgs,
    "-filter_complex",
    filterComplex,
    "-map",
    "[out]",
    "-ar",
    "44100",
    outputPath,
  ];

  const startedAt = Date.now();
  try {
    await runFfmpeg(args, MIX_TIMEOUT_MS);
  } catch (err) {
    safeUnlink(outputPath);
    throw err;
  }
  const durationMs = Date.now() - startedAt;

  return { outputFile, outputPath, durationMs, trackCount: project.tracks.length };
}

module.exports = { mixAudio };
