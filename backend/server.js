const express = require("express");
const multer = require("multer");
const cors = require("cors");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");
const db = require("./db/db");

const app = express();
app.use(cors());
app.use(express.json());


app.post("/cadastro", async (req, res) => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ erro: "Campos obrigatórios faltando" });
  }

  const senhaHash = await bcrypt.hash(senha, 10);

  const query = `
    INSERT INTO usuarios (nome, email, senha)
    VALUES (?, ?, ?)
  `;

  db.run(query, [nome, email, senhaHash], (err) => {
    if (err) return res.status(500).json({ erro: "Erro ao cadastrar usuário" });
    res.json({ mensagem: "Usuário cadastrado!" });
  });
});

app.post("/login", (req, res) => {
  const { email, senha } = req.body;
  console.log("login efetuado", email)

  db.get("SELECT * FROM usuarios WHERE email = ?", [email], async (err, usuario) => {
    if (err) return res.status(500).json({ erro: "Erro no servidor" });
    if (!usuario) return res.status(404).json({ erro: "Usuário não encontrado" });

    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

    if (!senhaCorreta) return res.status(401).json({ erro: "Senha incorreta" });

    res.status(200)
    res.json({ mensagem: "Login realizado!", usuario });
  });
});


// === REGISTRO DE LOGS ===
app.post("/log", (req, res) => {
  const { thread_id, mensagem } = req.body;

  if (!thread_id || !mensagem) {
    return res.status(400).json({ erro: "Campos faltando" });
  }

  db.run(
    "INSERT INTO logs (thread_id, mensagem) VALUES (?, ?)",
    [thread_id, mensagem],
    (err) => {
      if (err) return res.status(500).json({ erro: "Erro ao registrar log" });

      res.json({ mensagem: "Log registrado!" });
    }
  );
});


// === CONFIG UPLOAD ===
const upload = multer({
  dest: "uploads/"
});

// === ROTA DE CONVERSÃO ===
app.post("/audio/convert", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Nenhum arquivo enviado" });
  }

  const inputPath = req.file.path;
  const originalName = req.file.originalname;
  const outputFormat = req.body.format || "mp3";

  const outputFile = `${Date.now()}.${outputFormat}`;
  const outputPath = path.join("output", outputFile);

  // === COMANDO FFMPEG REAL ===
  const cmd = `ffmpeg -i "${inputPath}" "${outputPath}" -y`;

  exec(cmd, (err) => {
    // apaga o arquivo original
    fs.unlinkSync(inputPath);

    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Erro ao converter arquivo" });
    }

    res.download(outputPath, originalName + "." + outputFormat, () => {
    });
  });
});

// === SERVE OS ARQUIVOS CONVERTIDOS ===
app.use("/output", express.static(path.join(__dirname, "output")));

app.listen(3001, () => {
  console.log("Servidor rodando em http://localhost:3001");
});

