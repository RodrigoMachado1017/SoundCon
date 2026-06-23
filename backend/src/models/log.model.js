const { supabaseAdmin, isConfigured } = require("../config/supabase");

// Camada de acesso à tabela `logs` no Postgres (Supabase).
// Sem Supabase configurado, vira no-op (não derruba conversão em dev/test).
async function insertLog({
  threadId,
  mensagem,
  pitchCents = null,
  engine = null,
  qualityLevel = null,
  durationMs = null,
}) {
  if (!isConfigured) return;

  const { error } = await supabaseAdmin.from("logs").insert({
    thread_id: threadId,
    mensagem,
    pitch_cents: pitchCents,
    engine,
    quality_level: qualityLevel,
    duration_ms: durationMs,
  });

  if (error) {
    throw new Error(`Falha ao inserir log: ${error.message}`);
  }
}

module.exports = { insertLog };
