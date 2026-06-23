const multer = require("multer");
const { uploadsDir } = require("../config/paths");

// Limite de tamanho por arquivo para evitar exaustão de disco/memória.
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

const upload = multer({
  dest: uploadsDir,
  limits: { fileSize: MAX_FILE_SIZE },
});

module.exports = { upload, MAX_FILE_SIZE };
