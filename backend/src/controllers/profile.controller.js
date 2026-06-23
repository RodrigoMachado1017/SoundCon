const profileModel = require("../models/profile.model");

// GET /me — perfil do usuário autenticado.
async function getMe(req, res, next) {
  try {
    const profile = await profileModel.getProfile(req.user.id);
    return res.json({ profile });
  } catch (err) {
    return next(err);
  }
}

// PUT /me — atualiza o nome do perfil do usuário autenticado.
async function updateMe(req, res, next) {
  const { nome } = req.body;
  if (!nome || !String(nome).trim()) {
    return res.status(400).json({ error: "Nome é obrigatório." });
  }

  try {
    const profile = await profileModel.updateProfile(req.user.id, { nome: String(nome).trim() });
    return res.json({ profile });
  } catch (err) {
    return next(err);
  }
}

module.exports = { getMe, updateMe };
