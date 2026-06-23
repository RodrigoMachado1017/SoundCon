process.env.SOUNDCON_DISABLE_AUTH = "1"; // bypassa auth nos testes de integração

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { spawnSync } = require("node:child_process");

const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
const { app } = require("../server");

function createToneFile(filePath, freq) {
  const result = spawnSync(
    ffmpegInstaller.path,
    [
      "-hide_banner", "-y", "-f", "lavfi",
      "-i", `sine=frequency=${freq}:duration=1`,
      "-ar", "44100", "-ac", "2", filePath,
    ],
    { encoding: "utf8" }
  );
  if (result.status !== 0) {
    throw new Error(`Não foi possível gerar arquivo de teste: ${result.stderr}`);
  }
}

test("POST /audio/mix renderiza 2 faixas com efeitos e devolve url", async () => {
  const server = app.listen(0);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "soundcon-mix-"));
  const fileA = path.join(tmpDir, "a.wav");
  const fileB = path.join(tmpDir, "b.wav");

  try {
    createToneFile(fileA, 220);
    createToneFile(fileB, 440);

    const project = {
      tracks: [
        {
          fileIndex: 0,
          gainDb: -3,
          pan: -0.3,
          fx: [
            { type: "highpass", enabled: true, params: { f: 80, poles: 2 } },
            { type: "equalizer10", enabled: true, params: { g4: 4, g5: -3 } },
          ],
        },
        {
          fileIndex: 1,
          gainDb: -6,
          pan: 0.3,
          fx: [{ type: "acompressor", enabled: true, params: { thresholdDb: -18, ratio: 4 } }],
        },
      ],
      master: { gainDb: 0, limiter: true },
    };

    const data = new FormData();
    data.append("files", new Blob([fs.readFileSync(fileA)], { type: "audio/wav" }), "a.wav");
    data.append("files", new Blob([fs.readFileSync(fileB)], { type: "audio/wav" }), "b.wav");
    data.append("format", "wav");
    data.append("project", JSON.stringify(project));

    const resp = await fetch(`${baseUrl}/audio/mix`, { method: "POST", body: data });
    const body = await resp.json();

    assert.equal(resp.status, 200, `esperado 200, veio ${resp.status}: ${JSON.stringify(body)}`);
    assert.ok(body.url && body.url.startsWith("/output/"));
  } finally {
    server.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
