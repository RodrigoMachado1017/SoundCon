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
  const ffmpegPath = ffmpegInstaller.path;
  const result = spawnSync(
    ffmpegPath,
    [
      "-hide_banner",
      "-y",
      "-f",
      "lavfi",
      "-i",
      "sine=frequency=440:duration=1",
      "-ar",
      "44100",
      "-ac",
      "2",
      filePath,
    ],
    { encoding: "utf8" }
  );

  if (result.status !== 0) {
    throw new Error(`Não foi possível gerar arquivo de teste: ${result.stderr}`);
  }
}

async function requestConvert(baseUrl, tonePath, { format = "mp3", pitchCents = "0" } = {}) {
  const data = new FormData();
  const buffer = fs.readFileSync(tonePath);
  data.append("file", new Blob([buffer], { type: "audio/wav" }), path.basename(tonePath));
  data.append("format", format);
  data.append("pitchCents", String(pitchCents));

  const resp = await fetch(`${baseUrl}/audio/convert`, {
    method: "POST",
    body: data,
  });

  return { status: resp.status, body: await resp.json() };
}

test("POST /audio/convert with pitchCents=0 keeps compatibility and returns metadata", async () => {
  const server = app.listen(0);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "soundcon-test-"));
  const tonePath = path.join(tmpDir, "tone.wav");

  try {
    createToneFile(tonePath);
    const { status, body } = await requestConvert(baseUrl, tonePath, { pitchCents: 0 });

    assert.equal(status, 200);
    assert.ok(body.url);
    assert.equal(body.pitch.cents, 0);
    assert.equal(body.pitch.ratio, 1);
    assert.ok(["rubberband", "fallback"].includes(body.pitch.engine));
    assert.equal(body.quality.level, "safe");
    assert.equal(body.quality.warning, null);
  } finally {
    server.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("POST /audio/convert returns high_risk warning for large pitch shifts", async () => {
  const server = app.listen(0);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "soundcon-test-"));
  const tonePath = path.join(tmpDir, "tone.wav");

  try {
    createToneFile(tonePath);
    const { status, body } = await requestConvert(baseUrl, tonePath, { pitchCents: 700 });

    assert.equal(status, 200);
    assert.equal(body.quality.level, "high_risk");
    assert.ok(typeof body.quality.warning === "string" && body.quality.warning.length > 0);
  } finally {
    server.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("POST /audio/convert blocks cents above hard limit", async () => {
  const server = app.listen(0);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "soundcon-test-"));
  const tonePath = path.join(tmpDir, "tone.wav");

  try {
    createToneFile(tonePath);
    const { status, body } = await requestConvert(baseUrl, tonePath, { pitchCents: 901 });

    assert.equal(status, 422);
    assert.match(body.error, /máximo permitido/i);
  } finally {
    server.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
