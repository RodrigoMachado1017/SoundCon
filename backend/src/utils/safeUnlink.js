const fs = require("fs");

function safeUnlink(filePath) {
  if (!filePath) return;
  try {
    fs.unlinkSync(filePath);
  } catch (err) {
    if (err.code !== "ENOENT") {
      console.error("Erro ao remover arquivo:", err.message);
    }
  }
}

module.exports = { safeUnlink };
