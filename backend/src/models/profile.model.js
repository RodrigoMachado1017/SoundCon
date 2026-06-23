const { supabaseAdmin, isConfigured } = require("../config/supabase");

function ensureConfigured() {
  if (!isConfigured) {
    const err = new Error("Supabase não configurado no servidor.");
    err.statusCode = 503;
    throw err;
  }
}

// Perfil do usuário (tabela `profiles`, 1:1 com auth.users via id).
async function getProfile(userId) {
  ensureConfigured();
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, nome, created_at")
    .eq("id", userId)
    .single();

  if (error) throw new Error(`Falha ao buscar perfil: ${error.message}`);
  return data;
}

async function updateProfile(userId, { nome }) {
  ensureConfigured();
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .update({ nome })
    .eq("id", userId)
    .select("id, nome, created_at")
    .single();

  if (error) throw new Error(`Falha ao atualizar perfil: ${error.message}`);
  return data;
}

module.exports = { getProfile, updateProfile };
