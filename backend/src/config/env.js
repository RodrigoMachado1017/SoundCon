// Carrega variáveis de ambiente do .env quando disponível.
// dotenv é opcional nesta fase (instalado na Fase 1 junto do Supabase);
// o require protegido evita quebrar `npm test`/`npm start` antes da instalação.
try {
  // eslint-disable-next-line global-require
  require("dotenv").config({ quiet: true });
} catch (_) {
  /* dotenv ainda não instalado — segue com process.env padrão */
}

const PORT = Number(process.env.PORT) || 3001;

module.exports = {
  PORT,
};
