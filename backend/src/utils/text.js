// Remove acentos/diacríticos e normaliza para minúsculas, para comparação de
// mensagens de erro independente de acentuação.
const DIACRITICS = new RegExp("[\\u0300-\\u036f]", "g");

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(DIACRITICS, "")
    .toLowerCase();
}

module.exports = { normalizeText };
