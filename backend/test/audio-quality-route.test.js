process.env.SOUNDCON_DISABLE_AUTH = "1"; // bypassa auth nos testes de integração

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { spawnSync } = require("node:child_process");

const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
const { app } = require("../server");

function createToneFile(filePath) {
  const r = spawnSync(
    ffmpegInstaller.path,
    ["-hide_banner", "-y", "-f", "lavfi", "-i", "sine=frequency=440:duration=1", "-ar", "44100", "-ac", "2", filePath],
    { encoding: "utf8" }
  );
  if (r.status !== 0) throw new Error(`Falha ao gerar tom: ${r.stderr}`);
}

// Lê os metadados do arquivo de saída via ffmpeg -i (info vai para stderr).
function probe(filePath) {
  const r = spawnSync(ffmpegInstaller.path, ["-hide_banner", "-i", filePath], { encoding: "utf8" });
  return `${r.stdout || ""}\n${r.stderr || ""}`;
}

test("POST /audio/convert aplica sample rate 48000 e WAV 24-bit", async () => {
  const server = app.listen(0);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "soundcon-q-"));
  const tonePath = path.join(tmpDir, "tone.wav");

  try {
    createToneFile(tonePath);

    const data = new FormData();
    data.append("file", new Blob([fs.readFileSync(tonePath)], { type: "audio/wav" }), "tone.wav");
    data.append("format", "wav");
    data.append("pitchCents", "0");
    data.append("sampleRate", "48000");
    data.append("bitDepth", "24");

    const resp = await fetch(`${baseUrl}/audio/convert`, { method: "POST", body: data });
    const body = await resp.json();
    assert.equal(resp.status, 200, JSON.stringify(body));
    assert.equal(body.sampleRate, 48000);

    const outPath = path.join(__dirname, "..", "output", path.basename(body.url));
    const info = probe(outPath);
    assert.match(info, /48000 Hz/);
    assert.match(info, /pcm_s24le/);

    fs.rmSync(outPath, { force: true });
  } finally {
    server.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
