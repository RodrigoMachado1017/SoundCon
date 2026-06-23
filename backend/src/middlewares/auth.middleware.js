const { supabaseAdmin, isConfigured } = require("../config/supabase");

let warnedOpen = false;

// Valida o JWT do Supabase enviado em `Authorization: Bearer <token>`.
// Em rota protegida, popula req.user. Sem Supabase configurado (dev/test),
// não bloqueia — apenas avisa uma vez — para não travar o ambiente local.
async function requireAuth(req, res, next) {
  // Bypass exclusivo para testes automatizados (definido pelos arquivos de teste).
  if (process.env.SOUNDCON_DISABLE_AUTH === "1") {
    return next();
  }

  if (!isConfigured) {
    if (!warnedOpen) {
      console.warn(
        "[auth] Supabase não configurado — rotas protegidas estão ABERTAS. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no backend/.env."
      );
      warnedOpen = true;
    }
    return next();
  }

  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : null;

  if (!token) {
    return res.status(401).json({ error: "Token de autenticação ausente." });
  }

  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ error: "Sessão inválida ou expirada." });
    }
    req.user = data.user;
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Falha ao validar sessão." });
  }
}

module.exports = { requireAuth };
