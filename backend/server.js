// Bootstrap do servidor. Toda a aplicação vive em src/ (arquitetura MVC).
const { PORT } = require("./src/config/env"); // carrega .env antes de tudo
const app = require("./src/app");

function startServer(port = PORT) {
  return app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
