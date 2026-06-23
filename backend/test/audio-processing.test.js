const test = require("node:test");
const assert = require("node:assert/strict");

const {
  ALLOWED_FORMATS,
  calculatePitchRatio,
  classifyQualityByCents,
  parsePitchCents,
  validateOutputFormat,
} = require("../audio-processing");

test("allowed formats whitelist is stable", () => {
  assert.deepEqual(ALLOWED_FORMATS, ["mp3", "wav", "ogg", "aac", "flac", "m4a", "opus"]);
});

test("parsePitchCents defaults to zero when value is not sent", () => {
  assert.equal(parsePitchCents(undefined), 0);
  assert.equal(parsePitchCents(""), 0);
  assert.equal(parsePitchCents(null), 0);
});

test("parsePitchCents accepts integer values and rejects invalid input", () => {
  assert.equal(parsePitchCents("300"), 300);
  assert.equal(parsePitchCents("-900"), -900);
  assert.throws(() => parsePitchCents("3.14"), /inteiro/);
  assert.throws(() => parsePitchCents("abc"), /inteiro/);
});

test("validateOutputFormat enforces whitelist", () => {
  assert.equal(validateOutputFormat("mp3"), "mp3");
  assert.equal(validateOutputFormat("FLAC"), "flac");
  assert.throws(() => validateOutputFormat("exe"), /Formato de saída inválido/);
});

test("calculatePitchRatio uses cents base formula", () => {
  assert.equal(calculatePitchRatio(0), 1);
  assert.ok(Math.abs(calculatePitchRatio(1200) - 2) < 1e-12);
  assert.ok(Math.abs(calculatePitchRatio(-1200) - 0.5) < 1e-12);
  assert.ok(Math.abs(calculatePitchRatio(300) - 1.189207115) < 1e-6);
});

test("classifyQualityByCents returns safe/caution/high_risk and blocks extremes", () => {
  assert.equal(classifyQualityByCents(0).level, "safe");
  assert.equal(classifyQualityByCents(300).level, "safe");
  assert.equal(classifyQualityByCents(301).level, "caution");
  assert.equal(classifyQualityByCents(600).level, "caution");
  assert.equal(classifyQualityByCents(601).level, "high_risk");
  assert.equal(classifyQualityByCents(900).level, "high_risk");
  assert.throws(() => classifyQualityByCents(901), /máximo permitido/);
});
