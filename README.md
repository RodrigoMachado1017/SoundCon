# 🟦 SoundCon – Estúdio de Áudio no Navegador

Aplicação web full-stack para **conversão, edição e masterização de áudio**. O backend
processa o áudio com **FFmpeg embutido** (sem instalação manual) e o frontend React
oferece desde a conversão simples até uma **DAW completa** rodando no navegador, com
preview ao vivo via Web Audio, mixagem multipista e uma cadeia de efeitos profissional
(EQ, dinâmica, filtros e realce estéreo).

Autenticação, perfis de usuário e logs de uso são gerenciados pelo **Supabase**.

---

## 📌 Funcionalidades

### 🎚️ DAW no navegador (`/daw`)
- Mixagem multipista com mixer (volume, pan, mute/solo) e medidores em tempo real
- Cadeia de efeitos (FX chain) com **preview ao vivo** em Web Audio
- Visualização de **forma de onda** e **espectro** (canvas + Web Worker)
- Transporte (play/pause/seek), knobs, undo/redo e projeto serializável
- Render final no backend via FFmpeg (`POST /audio/mix`)

### 🎛️ Catálogo de efeitos (server-authoritative)
Definido em [backend/src/services/effectCatalog.js](backend/src/services/effectCatalog.js) e
consumido pelo frontend via `GET /audio/effects`:
- **Filtros:** high-pass, low-pass, band-pass, band-reject
- **EQ:** equalizador 10 bandas, Super EQ 18 bandas, shelf de graves/agudos, FIR EQ
- **Dinâmica:** compressor, limitador, normalização dinâmica, loudness (EBU R128), ganho
- **Realce:** crystalizer, largura estéreo, crossfeed

### 🔄 Conversão de áudio (`/convert`)
- Upload de qualquer formato e conversão para MP3 / WAV / FLAC
- Controle de qualidade: sample rate, bitrate e bit depth
- Download dos arquivos servidos em `/output`

### 🎵 Pitch shift (`/pitch`)
- Alteração de tom (em cents) preservando a base do áudio

### 👤 Perfil & Autenticação
- Cadastro e login via **Supabase Auth** (JWT)
- Rotas protegidas no frontend (`ProtectedRoute`) e no backend (`requireAuth`)
- Edição de perfil (`GET`/`PUT /me`)

### 📜 Logs
- Cada conversão/uso gera um registro na tabela `logs` do Supabase (escrita via service-role)

---

## 🛠️ Tecnologias

| Camada | Stack |
|--------|-------|
| Backend | Node.js, Express 5, arquitetura MVC (`src/`) |
| Áudio | `fluent-ffmpeg` + `@ffmpeg-installer/ffmpeg` (FFmpeg embutido) |
| Upload | Multer |
| Auth / DB | Supabase (`@supabase/supabase-js`), dotenv |
| Frontend | React 19, React Router 7, Vite (rolldown-vite) |
| Áudio no cliente | Web Audio API, Web Workers, Canvas |
| Tooling | ESLint, `node --test` |

> **FFmpeg não precisa ser instalado manualmente** — o binário vem como dependência do backend.

---

## 📁 Estrutura do Projeto

```
SoundCon/
├── dev.js                 # Orquestrador: sobe backend + frontend juntos
├── package.json           # Script "npm run dev"
├── backend/
│   ├── server.js          # Bootstrap (carrega .env e sobe o app)
│   ├── src/
│   │   ├── app.js         # Express app (middlewares, rotas, /output estático)
│   │   ├── config/        # env, ffmpeg, paths, supabase
│   │   ├── routes/        # audio, profile, log
│   │   ├── controllers/   # audio, profile, log
│   │   ├── services/      # conversão, mix, processamento, effectCatalog
│   │   ├── middlewares/   # auth, upload, error handler
│   │   ├── models/        # profile, log
│   │   └── utils/         # runFfmpeg, safeUnlink, text
│   ├── supabase/schema.sql# Schema (profiles, logs, RLS, triggers)
│   ├── output/            # Arquivos convertidos servidos em /output
│   └── test/              # Testes (node --test)
└── frontend/
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── App.jsx        # Rotas (públicas + protegidas)
        ├── auth/          # AuthProvider, ProtectedRoute
        ├── pages/         # login, cadastro, home, convert, pitch, daw, user
        ├── components/    # AppLayout
        ├── daw/           # engine, components, hooks, workers, project
        └── services/      # api, supabase, audioQuality
```

---

## 🚀 Como Rodar

### Pré-requisitos
- [Node.js](https://nodejs.org) (18+)
- Um projeto [Supabase](https://supabase.com) (para auth, perfis e logs)

> O app **sobe sem Supabase configurado** para desenvolvimento local: as rotas
> protegidas ficam abertas (com aviso no console) e a persistência de logs vira no-op.

### 1️⃣ Configurar o Supabase (opcional em dev)
Rode [backend/supabase/schema.sql](backend/supabase/schema.sql) no SQL Editor do seu projeto
Supabase para criar as tabelas `profiles` e `logs`, as policies (RLS) e o trigger de
criação de perfil.

### 2️⃣ Variáveis de ambiente
**Backend** — copie `backend/.env.example` para `backend/.env`:
```env
PORT=3001
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...   # apenas no backend, NUNCA no frontend
SUPABASE_ANON_KEY=...
```

**Frontend** — copie `frontend/.env.example` para `frontend/.env`:
```env
VITE_API_BASE=http://localhost:3001
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...        # somente a anon key
```

### 3️⃣ Instalar dependências
```bash
cd backend  && npm install
cd ../frontend && npm install
```

### 4️⃣ Rodar (backend + frontend juntos)
Na raiz do projeto:
```bash
npm run dev
```
Isso executa o [dev.js](dev.js), que sobe os dois serviços num único terminal:
- **Backend:** http://localhost:3001
- **Frontend:** http://localhost:5173

> Para rodar separadamente: `cd backend && npm start` e `cd frontend && npm run dev`.

---

## 🌐 Endpoints da API

Todas as rotas de áudio protegidas exigem `Authorization: Bearer <JWT do Supabase>`.

### `GET /audio/effects` *(público)*
Retorna o catálogo de efeitos disponíveis (schema sem as funções de build), consumido
pelo frontend para montar a UI e o preview ao vivo.

### `POST /audio/convert` *(protegida)*
Upload + conversão. **Body (form-data):**
- `file` — arquivo de áudio
- `format` — `mp3` | `wav` | `flac`
- `pitchCents` *(opcional)* — deslocamento de tom em cents
- `sampleRate`, `bitrate`, `bitDepth` *(opcionais)* — qualidade
- `thread_id` *(opcional)* — agrupa logs

### `POST /audio/mix` *(protegida)*
Render multipista da DAW. **Body (form-data):**
- `files` — múltiplos arquivos de áudio
- `project` — projeto serializado (JSON)
- `format` — formato de saída

### `GET /me` · `PUT /me` *(protegidas)*
Lê e atualiza o perfil (`{ nome }`) do usuário autenticado.

### `POST /log`
Registra um evento de uso/conversão.

### Arquivos convertidos
Servidos estaticamente em `GET /output/:filename`.

---

## 🧪 Testes

No backend:
```bash
cd backend
npm test        # node --test
```

---

## 📝 Licença

Projeto livre para uso em estudos e fins acadêmicos.
