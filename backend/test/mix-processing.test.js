const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildFilterComplex,
  buildTrackChain,
  parseMixRequest,
} = require("../src/services/mixProcessing.service");

test("buildTrackChain inclui FX habilitados, ganho e pan; ignora desabilitados", () => {
  const chain = buildTrackChain({
    gainDb: -3,
    pan: 0,
    fx: [
      { type: "highpass", enabled: true, params: { f: 80, poles: 2 } },
      { type: "lowpass", enabled: false, params: { f: 12000 } },
    ],
  });
  assert.match(chain, /highpass=f=80:p=2/);
  assert.doesNotMatch(chain, /lowpass/);
  assert.match(chain, /volume=-3dB/);
  assert.match(chain, /pan=stereo/);
});

test("buildFilterComplex com 1 faixa não usa amix e mapeia [out]", () => {
  const project = parseMixRequest(
    { tracks: [{ fileIndex: 0, gainDb: 0, pan: 0, fx: [] }], master: { gainDb: 0, limiter: true } },
    1
  );
  const graph = buildFilterComplex(project);
  assert.match(graph, /\[0:a\]/);
  assert.match(graph, /\[a0\]/);
  assert.doesNotMatch(graph, /amix/);
  assert.match(graph, /\[out\]$/);
  assert.match(graph, /alimiter=limit=0.98/);
});

test("buildFilterComplex com 2 faixas usa amix=inputs=2:normalize=0", () => {
  const project = parseMixRequest(
    {
      tracks: [
        { fileIndex: 0, gainDb: 0, pan: -0.5, fx: [] },
        { fileIndex: 1, gainDb: -6, pan: 0.5, fx: [] },
      ],
      master: { gainDb: 0, limiter: false },
    },
    2
  );
  const graph = buildFilterComplex(project);
  assert.match(graph, /\[0:a\]/);
  assert.match(graph, /\[1:a\]/);
  assert.match(graph, /amix=inputs=2,volume=2/);
  assert.match(graph, /\[out\]$/);
  assert.doesNotMatch(graph, /alimiter/); // limiter desligado
});

test("parseMixRequest rejeita projeto sem faixas e fileIndex inválido", () => {
  assert.throws(() => parseMixRequest({ tracks: [] }, 1), /ao menos uma faixa/);
  assert.throws(
    () => parseMixRequest({ tracks: [{ fileIndex: 5, gainDb: 0, pan: 0, fx: [] }] }, 1),
    /arquivo inexistente/
  );
});

test("parseMixRequest faz clamp de ganho e pan", () => {
  const project = parseMixRequest(
    { tracks: [{ fileIndex: 0, gainDb: 999, pan: -9, fx: [] }], master: { gainDb: -999 } },
    1
  );
  assert.equal(project.tracks[0].gainDb, 24);
  assert.equal(project.tracks[0].pan, -1);
  assert.equal(project.master.gainDb, -60);
});
