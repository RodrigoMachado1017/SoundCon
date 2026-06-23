import { dbToLin } from "./meters";

// Cria um nó de efeito Web Audio a partir da definição do catálogo (vinda do
// backend) e dos parâmetros atuais. Retorna um handle imperativo:
//   { input, output, setParam(key, value), dispose() }
// Para efeitos "export" (sem equivalente em tempo real), devolve um passthrough.
//
// O preview ao vivo cobre os efeitos "exact"/"approx". O render final (FFmpeg)
// é sempre fiel aos parâmetros, independentemente do preview.

const EQ10_Q = 1.4;

function biquad(ctx, type, params, mapping) {
  const node = ctx.createBiquadFilter();
  node.type = type;
  const apply = (key, value) => mapping(node, key, value, params);
  Object.keys(params).forEach((k) => apply(k, params[k]));
  return {
    input: node,
    output: node,
    setParam: (key, value) => {
      params[key] = value;
      apply(key, value);
    },
    dispose: () => node.disconnect(),
  };
}

// Cadeia em série de N biquads (EQ multibanda). input=primeiro, output=último.
function biquadChain(ctx, nodes) {
  for (let i = 0; i < nodes.length - 1; i += 1) nodes[i].connect(nodes[i + 1]);
  return nodes;
}

function makeExact(ctx, def, params) {
  switch (def.type) {
    case "highpass":
      return biquad(ctx, "highpass", params, (n, k, v) => {
        if (k === "f") n.frequency.value = v;
      });
    case "lowpass":
      return biquad(ctx, "lowpass", params, (n, k, v) => {
        if (k === "f") n.frequency.value = v;
      });
    case "bandpass":
      return biquad(ctx, "bandpass", params, (n, k, v, p) => {
        if (k === "f") n.frequency.value = v;
        if (k === "w") n.Q.value = Math.max(0.0001, p.w);
      });
    case "bandreject":
      return biquad(ctx, "notch", params, (n, k, v, p) => {
        if (k === "f") n.frequency.value = v;
        if (k === "w") n.Q.value = Math.max(0.0001, p.w);
      });
    case "bass":
      return biquad(ctx, "lowshelf", params, (n, k, v) => {
        if (k === "f") n.frequency.value = v;
        if (k === "g") n.gain.value = v;
      });
    case "treble":
      return biquad(ctx, "highshelf", params, (n, k, v) => {
        if (k === "f") n.frequency.value = v;
        if (k === "g") n.gain.value = v;
      });
    case "volume": {
      const node = ctx.createGain();
      node.gain.value = dbToLin(params.gainDb ?? 0);
      return {
        input: node,
        output: node,
        setParam: (key, value) => {
          params[key] = value;
          if (key === "gainDb") node.gain.value = dbToLin(value);
        },
        dispose: () => node.disconnect(),
      };
    }
    default:
      return null;
  }
}

function makeEq10(ctx, def, params) {
  const freqs = def.freqs || [];
  const nodes = freqs.map((f, i) => {
    const n = ctx.createBiquadFilter();
    n.type = "peaking";
    n.frequency.value = f;
    n.Q.value = EQ10_Q;
    n.gain.value = params[`g${i}`] ?? 0;
    return n;
  });
  biquadChain(ctx, nodes);
  return {
    input: nodes[0],
    output: nodes[nodes.length - 1],
    setParam: (key, value) => {
      params[key] = value;
      const idx = Number(key.slice(1));
      if (nodes[idx]) nodes[idx].gain.value = value;
    },
    dispose: () => nodes.forEach((n) => n.disconnect()),
  };
}

function makeSuperEq(ctx, def, params) {
  const freqs = def.freqs || [];
  const nodes = freqs.map((f, i) => {
    const n = ctx.createBiquadFilter();
    n.type = "peaking";
    n.frequency.value = f;
    n.Q.value = 2.0;
    // superequalizer usa ganho linear (1 = unidade); aproxima em dB.
    n.gain.value = 20 * Math.log10(Math.max(0.001, params[`b${i}`] ?? 1));
    return n;
  });
  biquadChain(ctx, nodes);
  return {
    input: nodes[0],
    output: nodes[nodes.length - 1],
    setParam: (key, value) => {
      params[key] = value;
      const idx = Number(key.slice(1));
      if (nodes[idx]) nodes[idx].gain.value = 20 * Math.log10(Math.max(0.001, value));
    },
    dispose: () => nodes.forEach((n) => n.disconnect()),
  };
}

function makeCompressor(ctx, def, params, { brickwall = false } = {}) {
  const node = ctx.createDynamicsCompressor();
  const apply = () => {
    if (brickwall) {
      node.threshold.value = params.limitDb ?? -1;
      node.ratio.value = 20;
      node.attack.value = Math.max(0, (params.attack ?? 5) / 1000);
      node.release.value = Math.max(0, (params.release ?? 50) / 1000);
      node.knee.value = 0;
    } else {
      node.threshold.value = params.thresholdDb ?? -18;
      node.ratio.value = params.ratio ?? 4;
      node.attack.value = Math.max(0, (params.attack ?? 20) / 1000);
      node.release.value = Math.max(0, (params.release ?? 250) / 1000);
      node.knee.value = params.knee ?? 2.8;
    }
  };
  apply();
  return {
    input: node,
    output: node,
    setParam: (key, value) => {
      params[key] = value;
      apply();
    },
    dispose: () => node.disconnect(),
  };
}

function makePassthrough(ctx) {
  const node = ctx.createGain();
  node.gain.value = 1;
  return {
    input: node,
    output: node,
    setParam: () => {},
    dispose: () => node.disconnect(),
  };
}

// Cria o handle de efeito conforme o previewMode e o tipo.
export function createEffectNode(ctx, def, initialParams) {
  // Cópia mutável dos params (a fonte da verdade para serializar fica no estado React).
  const params = { ...initialParams };

  if (def.type === "equalizer10") return makeEq10(ctx, def, params);
  if (def.type === "superequalizer") return makeSuperEq(ctx, def, params);
  if (def.type === "acompressor") return makeCompressor(ctx, def, params);
  if (def.type === "alimiter") return makeCompressor(ctx, def, params, { brickwall: true });

  const exact = makeExact(ctx, def, params);
  if (exact) return exact;

  // loudnorm, dynaudnorm, crystalizer, stereowiden, crossfeed, firequalizer: render-only.
  return makePassthrough(ctx);
}

// Defaults a partir do schema do catálogo.
export function defaultParams(def) {
  const out = {};
  for (const spec of def.params) out[spec.key] = spec.def;
  return out;
}
