const logModel = require("../models/log.model");

// Log estruturado de uma conversão de áudio (mantém o mesmo formato JSON usado
// antes do refator MVC, para não quebrar consumidores dos logs).
function insertConversionLog({ threadId, pitchCents, engine, qualityLevel, durationMs, outputFile }) {
  const mensagem = JSON.stringify({
    event: "audio.convert",
    outputFile,
    pitchCents,
    engine,
    qualityLevel,
    durationMs,
    timestamp: new Date().toISOString(),
  });

  return logModel.insertLog({
    threadId: threadId || "audio.convert",
    mensagem,
    pitchCents,
    engine,
    qualityLevel,
    durationMs,
  });
}

// Log manual genérico (endpoint POST /log).
function registerLog({ threadId, mensagem }) {
  return logModel.insertLog({ threadId, mensagem });
}

module.exports = { insertConversionLog, registerLog };
