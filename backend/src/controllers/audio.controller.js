const { convertAudio } = require("../services/audioConvert.service");
const { mixAudio } = require("../services/audioMix.service");
const { getPublicCatalog } = require("../services/mixProcessing.service");
const logService = require("../services/log.service");
const { safeUnlink } = require("../utils/safeUnlink");

// POST /audio/convert — controller magro: valida presença do arquivo, delega ao
// service e formata a resposta. Erros vão para o error.middleware central.
async function convert(req, res, next) {
  if (!req.file) {
    return res.status(400).json({ error: "Nenhum arquivo enviado" });
  }

  const inputPath = req.file.path;

  try {
    const result = await convertAudio({
      inputPath,
      format: req.body.format,
      pitchCentsRaw: req.body.pitchCents,
      sampleRateRaw: req.body.sampleRate,
      bitrate: req.body.bitrate,
      bitDepth: req.body.bitDepth,
    });

    try {
      await logService.insertConversionLog({
        threadId: req.body.thread_id,
        pitchCents: result.pitchCents,
        engine: result.engine,
        qualityLevel: result.quality.level,
        durationMs: result.durationMs,
        outputFile: result.outputFile,
      });
    } catch (logErr) {
      console.error("Falha ao salvar log de conversao:", logErr.message);
    }

    return res.json({
      url: `/output/${result.outputFile}`,
      pitch: {
        cents: result.pitchCents,
        ratio: Number(result.ratio.toFixed(10)),
        engine: result.engine,
      },
      quality: result.quality,
      sampleRate: result.sampleRate,
    });
  } catch (err) {
    return next(err);
  } finally {
    safeUnlink(inputPath);
  }
}

// GET /audio/effects — catálogo de efeitos disponíveis (server-authoritative).
function effects(req, res) {
  return res.json({ effects: getPublicCatalog() });
}

// POST /audio/mix — render multitrack a partir do projeto serializado.
async function mix(req, res, next) {
  const files = req.files || [];
  if (files.length === 0) {
    return res.status(400).json({ error: "Nenhum arquivo enviado" });
  }

  try {
    const result = await mixAudio({
      rawProject: req.body.project,
      rawFormat: req.body.format,
      files,
    });

    try {
      await logService.insertConversionLog({
        threadId: req.body.thread_id || "audio.mix",
        pitchCents: null,
        engine: "mix",
        qualityLevel: `tracks:${result.trackCount}`,
        durationMs: result.durationMs,
        outputFile: result.outputFile,
      });
    } catch (logErr) {
      console.error("Falha ao salvar log de mix:", logErr.message);
    }

    return res.json({ url: `/output/${result.outputFile}` });
  } catch (err) {
    return next(err);
  } finally {
    files.forEach((f) => safeUnlink(f.path));
  }
}

module.exports = { convert, effects, mix };
