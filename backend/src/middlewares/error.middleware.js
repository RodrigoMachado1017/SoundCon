const { normalizeText } = require("../utils/text");

// Handler central de erros. Mapeia mensagens de validação/FFmpeg para os mesmos
// códigos HTTP que o backend retornava antes do refator MVC.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const normalizedMessage = normalizeText(err.message);

  // Upload acima do limite (multer).
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "Arquivo excede o tamanho máximo permitido (100 MB)." });
  }

  if (normalizedMessage.includes("intervalo maximo permitido")) {
    return res.status(422).json({ error: err.message });
  }

  if (normalizedMessage.includes("formato de saida invalido")) {
    return res.status(400).json({ error: err.message });
  }

  if (normalizedMessage.includes("pitchcents deve ser um numero inteiro")) {
    return res.status(400).json({ error: err.message });
  }

  if (err.statusCode) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  console.error(err);
  return res.status(500).json({ error: "Erro ao converter arquivo" });
}

module.exports = { errorHandler };
