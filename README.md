# 🟦 SoundCon – Conversor de Áudio Universal

Sistema web completo que permite converter arquivos de áudio usando FFmpeg no backend Node.js.
Inclui upload, conversão, download automático, autenticação e banco de dados SQLite para armazenar usuários e logs.

---

## 📌 Funcionalidades

### 🎵 Conversão de Áudio
- Upload de qualquer formato de áudio (MP3/WAV/FLAC/etc)
- Conversão usando FFmpeg
- Download automático no navegador
- Funciona via navegador e via Postman

### 👤 Sistema de Usuários
- Cadastro de usuários
- Login com verificação de senha (hash)
- Armazenamento no SQLite

### 📜 Logs
- Cada conversão gera um registro no banco
- Log possui: id, mensagem

---

## 🛠️ Tecnologias Utilizadas

| Tecnologia | Função |
|-----------|--------|
| Node.js | Backend |
| Express | Servidor HTTP |
| Multer | Upload de arquivos |
| SQLite3 | Banco de dados |
| FFmpeg | Conversão |
| React | Frontend |
| Fetch API | Comunicação front-back |

---

## 📁 Estrutura do Projeto

```
SoundCon/
├── backend/
│   ├── uploads/
│   ├── output/
│   ├── database.sqlite
│   ├── server.js
│   └── package.json
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── convert.jsx
    │   │   ├── login.jsx
    │   │   ├── cadastro.jsx
    │   │   └── home.jsx
    │   └── App.jsx
    ├── public/
    └── package.json
```

---

## 🚀 Como Rodar o Projeto

### 1️⃣ Instalar o Node.js
[Baixar em https://nodejs.org](https://nodejs.org)

### 2️⃣ Instalar o FFmpeg (Obrigatório)
- [Baixar builds](https://www.gyan.dev/ffmpeg/builds/)
- Extrair para: `C:\ffmpeg`
- Adicionar à variável PATH: `C:\ffmpeg\bin`
- Testar: `ffmpeg -version`

### 3️⃣ Instalar Dependências do Backend
No diretório `/backend`:
```bash
npm install express cors multer sqlite3
mkdir uploads
mkdir output
```

### 4️⃣ Configurar Banco SQLite
```bash
sqlite3 database.sqlite
```

Executar no SQLite:
```sql
CREATE TABLE usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  email TEXT UNIQUE,
  senha TEXT
);

CREATE TABLE logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mensagem TEXT
);
```

### 5️⃣ Rodar o Backend
```bash
node server.js
```
Servidor em: http://localhost:3001

### 6️⃣ Rodar o Front-End React
```bash
cd frontend
npm install
npm run dev
```
App em: http://localhost:5173

---

## 🌐 Endpoints da API

### 🔊 Upload e Conversão
**POST** `/audio/convert`

**Body (form-data):**
- `file`: arquivo de áudio
- `format`: mp3 | wav | flac

**Resposta:**
```json
{
  "message": "Convertido com sucesso",
  "filename": "173944444.mp3"
}
```

### 📥 Download
**GET** `/audio/download/:filename`

Exemplo: `http://localhost:3001/audio/download/173944444.mp3`

### 🔐 Registro
**POST** `/auth/register`
```json
{
  "nome":  "Teste da Silva",
  "email": "teste@gmail.com",
  "senha": "123456"
}
```

### 🔐 Login
**POST** `/auth/login`
```json
{
  "email": "teste@gmail.com",
  "senha": "123456"
}
```

**Resposta:**
```json
{
  "message": "Login autorizado",
  "user": { ... }
}
```

---

## 📦 Comandos Úteis

```bash
node -v
npm -v
npm init -y
npm install express cors multer sqlite3
ffmpeg -version
mkdir uploads
mkdir output
sqlite3 database.sqlite
.tables
SELECT * FROM usuarios;
SELECT * FROM logs;
node server.js
```

---

## 📝 Licença

Projeto livre para uso em estudos e fins acadêmicos.
