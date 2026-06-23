import { createEffectNode, defaultParams } from "./effectFactory";
import { dbToLin } from "./meters";

let TRACK_SEQ = 0;
let FX_SEQ = 0;

// Núcleo imperativo do áudio. Não conhece React: a UI fala com ele por refs.
// Master bus: [tracks] -> masterGain -> masterAnalyser -> destination.
export default class AudioEngine {
  constructor(catalog) {
    this.ctx = null;
    this.catalog = catalog; // mapa type -> def
    this.tracks = [];
    this.playing = false;
    this.startCtxTime = 0;
    this.startOffset = 0;
    this.master = null;
    this._onEnded = null;
  }

  // Lazy: AudioContext só nasce após gesto do usuário.
  ensureContext() {
    if (this.ctx) return this.ctx;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new Ctx();
    const gain = this.ctx.createGain();
    gain.gain.value = 1;
    const analyser = this.ctx.createAnalyser();
    analyser.fftSize = 2048;
    gain.connect(analyser);
    analyser.connect(this.ctx.destination);
    this.master = { gain, analyser, gainDb: 0 };
    return this.ctx;
  }

  get duration() {
    return this.tracks.reduce((m, t) => Math.max(m, t.buffer ? t.buffer.duration : 0), 0);
  }

  setMasterGainDb(db) {
    if (!this.master) return;
    this.master.gainDb = db;
    this.master.gain.gain.value = dbToLin(db);
  }

  // ---- Faixas --------------------------------------------------------
  async addTrack({ file, arrayBuffer }) {
    this.ensureContext();
    const buffer = await this.ctx.decodeAudioData(arrayBuffer.slice(0));
    const trackGain = this.ctx.createGain();
    const panner = this.ctx.createStereoPanner();
    const analyser = this.ctx.createAnalyser();
    analyser.fftSize = 1024;

    trackGain.connect(panner);
    panner.connect(analyser);
    analyser.connect(this.master.gain);

    const track = {
      id: ++TRACK_SEQ,
      name: file?.name || `Faixa ${TRACK_SEQ}`,
      file,
      buffer,
      gainDb: 0,
      pan: 0,
      muted: false,
      fx: [],
      nodes: { trackGain, panner, analyser },
      source: null,
      chainHead: trackGain,
    };
    this.tracks.push(track);
    this._rebuildChain(track);
    if (this.playing) this._startTrackSource(track, this.currentTime());
    return track;
  }

  removeTrack(trackId) {
    const idx = this.tracks.findIndex((t) => t.id === trackId);
    if (idx < 0) return;
    const track = this.tracks[idx];
    this._stopTrackSource(track);
    track.fx.forEach((fx) => fx.node.dispose());
    track.nodes.trackGain.disconnect();
    track.nodes.panner.disconnect();
    track.nodes.analyser.disconnect();
    track.buffer = null; // libera para GC
    this.tracks.splice(idx, 1);
  }

  setTrackGainDb(trackId, db) {
    const t = this._track(trackId);
    if (!t) return;
    t.gainDb = db;
    t.nodes.trackGain.gain.value = t.muted ? 0 : dbToLin(db);
  }

  setTrackPan(trackId, pan) {
    const t = this._track(trackId);
    if (!t) return;
    t.pan = pan;
    t.nodes.panner.pan.value = pan;
  }

  setTrackMuted(trackId, muted) {
    const t = this._track(trackId);
    if (!t) return;
    t.muted = muted;
    t.nodes.trackGain.gain.value = muted ? 0 : dbToLin(t.gainDb);
  }

  // ---- Cadeia de efeitos --------------------------------------------
  addEffect(trackId, type) {
    const t = this._track(trackId);
    const def = this.catalog.get(type);
    if (!t || !def) return null;
    const params = defaultParams(def);
    const node = createEffectNode(this.ctx, def, params);
    const fx = { id: ++FX_SEQ, type, enabled: true, params, node, previewMode: def.previewMode };
    t.fx.push(fx);
    this._rebuildChainLive(t);
    return fx;
  }

  removeEffect(trackId, fxId) {
    const t = this._track(trackId);
    if (!t) return;
    const idx = t.fx.findIndex((f) => f.id === fxId);
    if (idx < 0) return;
    t.fx[idx].node.dispose();
    t.fx.splice(idx, 1);
    this._rebuildChainLive(t);
  }

  toggleEffect(trackId, fxId, enabled) {
    const t = this._track(trackId);
    if (!t) return;
    const fx = t.fx.find((f) => f.id === fxId);
    if (!fx) return;
    fx.enabled = enabled;
    this._rebuildChainLive(t);
  }

  reorderEffect(trackId, fromIdx, toIdx) {
    const t = this._track(trackId);
    if (!t) return;
    const [moved] = t.fx.splice(fromIdx, 1);
    t.fx.splice(toIdx, 0, moved);
    this._rebuildChainLive(t);
  }

  setEffectParam(trackId, fxId, key, value) {
    const t = this._track(trackId);
    if (!t) return;
    const fx = t.fx.find((f) => f.id === fxId);
    if (!fx) return;
    fx.params[key] = value;
    fx.node.setParam(key, value);
  }

  // ---- Transporte ----------------------------------------------------
  async resume() {
    this.ensureContext();
    if (this.ctx.state === "suspended") await this.ctx.resume();
  }

  play() {
    if (this.playing) return;
    this.ensureContext();
    const offset = this.startOffset;
    this.tracks.forEach((t) => this._startTrackSource(t, offset));
    this.startCtxTime = this.ctx.currentTime;
    this.playing = true;
  }

  pause() {
    if (!this.playing) return;
    const t = this.currentTime();
    this.tracks.forEach((tr) => this._stopTrackSource(tr));
    this.startOffset = Math.min(t, this.duration);
    this.playing = false;
  }

  stop() {
    this.tracks.forEach((tr) => this._stopTrackSource(tr));
    this.startOffset = 0;
    this.playing = false;
  }

  seek(time) {
    const clamped = Math.max(0, Math.min(time, this.duration || 0));
    if (this.playing) {
      this.tracks.forEach((tr) => this._stopTrackSource(tr));
      this.startOffset = clamped;
      this.tracks.forEach((tr) => this._startTrackSource(tr, clamped));
      this.startCtxTime = this.ctx.currentTime;
    } else {
      this.startOffset = clamped;
    }
  }

  currentTime() {
    if (!this.playing || !this.ctx) return this.startOffset;
    const t = this.startOffset + (this.ctx.currentTime - this.startCtxTime);
    return Math.min(t, this.duration || 0);
  }

  onEnded(cb) {
    this._onEnded = cb;
  }

  // ---- Internos ------------------------------------------------------
  _track(id) {
    return this.tracks.find((t) => t.id === id);
  }

  _rebuildChain(track) {
    // Liga os FX habilitados em série e conecta a cauda ao trackGain.
    const enabled = track.fx.filter((f) => f.enabled);
    // Desconecta saídas dos fx e reconecta do zero.
    track.fx.forEach((f) => {
      try {
        f.node.output.disconnect();
      } catch {
        /* noop */
      }
    });
    // trackGain mantém ligação fixa a panner; só refazemos a entrada da cadeia.

    if (enabled.length === 0) {
      track.chainHead = track.nodes.trackGain;
      return;
    }
    for (let i = 0; i < enabled.length - 1; i += 1) {
      enabled[i].node.output.connect(enabled[i + 1].node.input);
    }
    enabled[enabled.length - 1].node.output.connect(track.nodes.trackGain);
    track.chainHead = enabled[0].node.input;
  }

  // Refaz a cadeia e, se tocando, reinicia a fonte para repegar o novo head.
  _rebuildChainLive(track) {
    const wasPlaying = this.playing;
    const at = this.currentTime();
    if (wasPlaying) this._stopTrackSource(track);
    this._rebuildChain(track);
    if (wasPlaying) this._startTrackSource(track, at);
  }

  _startTrackSource(track, offset) {
    if (!track.buffer) return;
    this._stopTrackSource(track);
    const src = this.ctx.createBufferSource();
    src.buffer = track.buffer;
    src.connect(track.chainHead);
    src.onended = () => {
      // Quando a faixa mais longa termina, marca parada.
      if (this.playing && this.currentTime() >= this.duration - 0.05) {
        this.playing = false;
        this.startOffset = 0;
        if (this._onEnded) this._onEnded();
      }
    };
    const safeOffset = Math.max(0, Math.min(offset, track.buffer.duration));
    src.start(0, safeOffset);
    track.source = src;
  }

  _stopTrackSource(track) {
    if (track.source) {
      try {
        track.source.onended = null;
        track.source.stop();
        track.source.disconnect();
      } catch {
        /* já parado */
      }
      track.source = null;
    }
  }

  dispose() {
    this.tracks.forEach((t) => {
      this._stopTrackSource(t);
      t.fx.forEach((f) => f.node.dispose());
    });
    this.tracks = [];
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}
