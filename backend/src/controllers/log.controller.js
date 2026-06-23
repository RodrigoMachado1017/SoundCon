const logService = require("../services/log.service");

// POST /log — registro manual de log.
async function registerLog(req, res) {
  const { thread_id, mensagem } = req.body;

  if (!thread_id || !mensagem) {
    return res.status(400).json({ erro: "Campos faltando" });
  }

  try {
    await logService.registerLog({ threadId: thread_id, mensagem });
    return res.json({ mensagem: "Log registrado!" });
  } catch (err) {
    return res.status(500).json({ erro: "Erro ao registrar log" });
  }
}

module.exports = { registerLog };
