// Shim de compatibilidade. A lógica foi movida para src/services/audioProcessing.service.js
// no refator MVC. Mantido para não quebrar imports existentes (ex.: backend/test).
module.exports = require("./src/services/audioProcessing.service");
