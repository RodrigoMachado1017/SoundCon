const { spawn } = require("child_process");
const { ffmpegPath, CONVERSION_TIMEOUT_MS } = require("../config/ffmpeg");

// Executa o FFmpeg com timeout rígido (SIGKILL). Rejeita com erro carregando
// statusCode (504 timeout / 500 falha) e o stderr para diagnóstico.
function runFfmpeg(args, timeoutMs = CONVERSION_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpegPath, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      if (timedOut) {
        const timeoutErr = new Error("Tempo limite excedido durante a conversao.");
        timeoutErr.statusCode = 504;
        timeoutErr.stderr = stderr;
        return reject(timeoutErr);
      }

      if (code !== 0) {
        const ffmpegErr = new Error("Erro ao converter arquivo com FFmpeg.");
        ffmpegErr.statusCode = 500;
        ffmpegErr.stderr = stderr || stdout;
        return reject(ffmpegErr);
      }

      resolve({ stdout, stderr });
    });
  });
}

module.exports = { runFfmpeg };
