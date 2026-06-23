const test = require("node:test");
const assert = require("node:assert/strict");

const {
  parseSampleRate,
  buildQualityArgs,
} = require("../src/services/audioProcessing.service");

test("parseSampleRate aceita whitelist e rejeita inválidos", () => {
  assert.equal(parseSampleRate(undefined), 44100);
  assert.equal(parseSampleRate(""), 44100);
  assert.equal(parseSampleRate("48000"), 48000);
  assert.equal(parseSampleRate(96000), 96000);
  assert.throws(() => parseSampleRate(12345), /Sample rate inválido/);
});

test("buildQualityArgs aplica bitrate em formatos lossy", () => {
  assert.deepEqual(buildQualityArgs("mp3", { bitrate: 320 }), ["-b:a", "320k"]);
  assert.deepEqual(buildQualityArgs("opus", { bitrate: 128 }), ["-b:a", "128k"]);
  // bitrate fora da whitelist é ignorado
  assert.deepEqual(buildQualityArgs("mp3", { bitrate: 1000 }), []);
  // formato lossy não usa bitDepth
  assert.deepEqual(buildQualityArgs("mp3", { bitDepth: 24 }), []);
});

test("buildQualityArgs aplica bit depth (codec/sample_fmt) em wav/flac", () => {
  assert.deepEqual(buildQualityArgs("wav", { bitDepth: 16 }), ["-c:a", "pcm_s16le"]);
  assert.deepEqual(buildQualityArgs("wav", { bitDepth: 24 }), ["-c:a", "pcm_s24le"]);
  assert.deepEqual(buildQualityArgs("wav", { bitDepth: 32 }), ["-c:a", "pcm_s32le"]);
  assert.deepEqual(buildQualityArgs("flac", { bitDepth: 16 }), ["-sample_fmt", "s16"]);
  assert.deepEqual(buildQualityArgs("flac", { bitDepth: 24 }), [
    "-sample_fmt",
    "s32",
    "-bits_per_raw_sample",
    "24",
  ]);
});
