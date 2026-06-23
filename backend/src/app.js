// Carrega o .env antes de qualquer módulo que leia process.env (ex.: config/supabase).
require("./config/env");

const express = require("express");
const cors = require("cors");

const routes = require("./routes");
const { errorHandler } = require("./middlewares/error.middleware");
const { outputDir } = require("./config/paths");

const app = express();

app.use(cors());
app.use(express.json());

app.use(routes);

// Servir os arquivos convertidos.
app.use("/output", express.static(outputDir));

// Handler central de erros (sempre por último).
app.use(errorHandler);

module.exports = app;
