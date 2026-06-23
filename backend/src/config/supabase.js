const { createClient } = require("@supabase/supabase-js");

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// O backend só está "ligado" ao Supabase quando ambas as variáveis existem.
// Sem elas (dev/test sem .env), o app continua subindo, mas rotas protegidas
// ficam abertas e a persistência de logs vira no-op (ver auth/log).
const isConfigured = Boolean(url && serviceRoleKey);

// Client com privilégios de service-role: ignora RLS. NUNCA exponha esta key no frontend.
const supabaseAdmin = isConfigured
  ? createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

module.exports = { supabaseAdmin, isConfigured };
