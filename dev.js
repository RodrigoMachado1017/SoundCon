#!/usr/bin/env node
/**
 * Sobe backend (Express) e frontend (Vite) juntos, num único terminal.
 * Uso:  node dev.js
 * Sem dependências externas. Encerra ambos com Ctrl+C.
 */
const { spawn } = require("child_process");
const path = require("path");

const isWin = process.platform === "win32";
const npm = isWin ? "npm.cmd" : "npm";

const COLORS = {
  backend: "\x1b[36m", // ciano
  frontend: "\x1b[35m", // magenta
  reset: "\x1b[0m",
  dim: "\x1b[2m",
};

const services = [
  { name: "backend", cwd: path.join(__dirname, "backend"), cmd: `${npm} start` },
  { name: "frontend", cwd: path.join(__dirname, "frontend"), cmd: `${npm} run dev` },
];

const children = [];
let shuttingDown = false;

function prefixWrite(name, chunk) {
  const color = COLORS[name] || "";
  const label = `${color}[${name}]${COLORS.reset}`;
  const text = chunk.toString();
  for (const line of text.split(/\r?\n/)) {
    if (line.length > 0) process.stdout.write(`${label} ${line}\n`);
  }
}

function start(service) {
  // Comando como string única + shell:true: resolve npm.cmd no Windows
  // e evita o DeprecationWarning de args+shell.
  const child = spawn(service.cmd, {
    cwd: service.cwd,
    shell: true,
    env: process.env,
  });

  child.stdout.on("data", (d) => prefixWrite(service.name, d));
  child.stderr.on("data", (d) => prefixWrite(service.name, d));

  child.on("exit", (code) => {
    prefixWrite(service.name, `processo encerrado (código ${code ?? 0})`);
    if (!shuttingDown) shutdown(code ?? 0);
  });

  child.on("error", (err) => {
    prefixWrite(service.name, `falha ao iniciar: ${err.message}`);
    if (!shuttingDown) shutdown(1);
  });

  children.push({ ...service, child });
}

function killChild(entry) {
  const { child } = entry;
  if (!child || child.killed) return;
  if (isWin) {
    // Mata a árvore de processos no Windows (npm -> node).
    spawn(`taskkill /pid ${child.pid} /T /F`, { shell: true });
  } else {
    child.kill("SIGTERM");
  }
}

function shutdown(code) {
  if (shuttingDown) return;
  shuttingDown = true;
  process.stdout.write(`\n${COLORS.dim}Encerrando serviços...${COLORS.reset}\n`);
  children.forEach(killChild);
  setTimeout(() => process.exit(code), 500);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

process.stdout.write(
  `${COLORS.dim}Iniciando SoundCon (backend :3001 + frontend Vite). Ctrl+C para parar.${COLORS.reset}\n`
);
services.forEach(start);
