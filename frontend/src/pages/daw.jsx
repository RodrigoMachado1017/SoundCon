import { useEffect, useMemo, useRef, useState } from "react";
import AppLayout from "../components/AppLayout";
import { getEffects, mixProject, fileUrl } from "../services/api";
import AudioEngine from "../daw/engine/AudioEngine";
import UndoStack from "../daw/engine/UndoStack";
import { defaultParams } from "../daw/engine/effectFactory";
import { serializeProject } from "../daw/project/serialize";
import { useRafLoop } from "../daw/hooks/useRafLoop";
import { useWaveformWorker } from "../daw/hooks/useWaveformWorker";
import TransportBar from "../daw/components/TransportBar";
import WaveformCanvas from "../daw/components/WaveformCanvas";
import MixerStrip from "../daw/components/MixerStrip";
import FxChainPanel from "../daw/components/FxChainPanel";
import MeterCanvas from "../daw/components/MeterCanvas";
import SpectrumCanvas from "../daw/components/SpectrumCanvas";
import Knob from "../daw/components/Knob";
import "../pages/dashboard.css";
import "../pages/daw.css";

const WAVE_BUCKETS = 1200;
const FORMATS = ["wav", "mp3", "flac", "ogg", "aac", "m4a", "opus"];

export default function Daw() {
  const { subscribe } = useRafLoop();
  const { computePeaks } = useWaveformWorker();

  const engineRef = useRef(null);
  const projectRef = useRef(null);
  const fileInputRef = useRef(null);
  const undoRef = useRef(new UndoStack(100));

  const [catalog, setCatalog] = useState([]);
  const catalogMap = useMemo(() => new Map(catalog.map((d) => [d.type, d])), [catalog]);
  const [project, setProject] = useState({ tracks: [], master: { gainDb: 0, limiter: true } });
  const [playing, setPlaying] = useState(false);
  const [format, setFormat] = useState("wav");
  const [exporting, setExporting] = useState(false);
  const [resultUrl, setResultUrl] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("neutral");
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  function syncHistory() {
    setCanUndo(undoRef.current.canUndo);
    setCanRedo(undoRef.current.canRedo);
  }

  useEffect(() => {
    projectRef.current = project;
  }, [project]);

  // Catálogo de efeitos (server-authoritative).
  useEffect(() => {
    let active = true;
    getEffects()
      .then((effects) => active && setCatalog(effects))
      .catch(() => active && setMessage("Não foi possível carregar o catálogo de efeitos."));
    return () => {
      active = false;
    };
  }, []);

  // Limpeza do engine ao desmontar (seguro p/ StrictMode).
  useEffect(() => {
    return () => {
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, []);

  // Atalho: espaço alterna play/pause (exceto digitando em campos).
  useEffect(() => {
    function onKey(e) {
      if (e.code !== "Space") return;
      const tag = (e.target.tagName || "").toLowerCase();
      if (["input", "select", "textarea", "button"].includes(tag)) return;
      e.preventDefault();
      if (playing) handlePause();
      else handlePlay();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  function ensureEngine() {
    if (!engineRef.current) {
      engineRef.current = new AudioEngine(catalogMap);
      engineRef.current.onEnded(() => setPlaying(false));
    }
    return engineRef.current;
  }

  // ---- Faixas --------------------------------------------------------
  async function handleFiles(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;

    const engine = ensureEngine();
    await engine.resume();

    for (const file of files) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const t = await engine.addTrack({ file, arrayBuffer });
        const peaks = await computePeaks(t.buffer, WAVE_BUCKETS);
        setProject((prev) => ({
          ...prev,
          tracks: [
            ...prev.tracks,
            { id: t.id, name: t.name, gainDb: 0, pan: 0, muted: false, fx: [], file, peaks },
          ],
        }));
      } catch (err) {
        setMessage(`Falha ao carregar ${file.name}: ${err.message}`);
        setMessageType("error");
      }
    }
  }

  function removeTrack(id) {
    engineRef.current?.removeTrack(id);
    setProject((prev) => ({ ...prev, tracks: prev.tracks.filter((t) => t.id !== id) }));
  }

  // ---- Aplicar/commit com undo --------------------------------------
  function applyTrackField(id, field, value) {
    const eng = engineRef.current;
    if (field === "gainDb") eng?.setTrackGainDb(id, value);
    if (field === "pan") eng?.setTrackPan(id, value);
    if (field === "muted") eng?.setTrackMuted(id, value);
    setProject((prev) => ({
      ...prev,
      tracks: prev.tracks.map((t) => (t.id === id ? { ...t, [field]: value } : t)),
    }));
  }

  function commitTrackField(id, field, value) {
    const prevTrack = projectRef.current?.tracks.find((t) => t.id === id);
    const old = prevTrack ? prevTrack[field] : value;
    applyTrackField(id, field, value);
    if (old !== value) {
      undoRef.current.push({
        undo: () => applyTrackField(id, field, old),
        redo: () => applyTrackField(id, field, value),
      });
      syncHistory();
    }
  }

  function applyFxParam(trackId, fxId, key, value) {
    engineRef.current?.setEffectParam(trackId, fxId, key, value);
    setProject((prev) => ({
      ...prev,
      tracks: prev.tracks.map((t) =>
        t.id === trackId
          ? { ...t, fx: t.fx.map((f) => (f.id === fxId ? { ...f, params: { ...f.params, [key]: value } } : f)) }
          : t
      ),
    }));
  }

  function commitFxParam(trackId, fxId, key, value) {
    const track = projectRef.current?.tracks.find((t) => t.id === trackId);
    const fx = track?.fx.find((f) => f.id === fxId);
    const old = fx ? fx.params[key] : value;
    applyFxParam(trackId, fxId, key, value);
    if (old !== value) {
      undoRef.current.push({
        undo: () => applyFxParam(trackId, fxId, key, old),
        redo: () => applyFxParam(trackId, fxId, key, value),
      });
      syncHistory();
    }
  }

  // ---- Efeitos -------------------------------------------------------
  function addEffect(trackId, type) {
    const def = catalogMap.get(type);
    if (!def) return;
    const fx = engineRef.current?.addEffect(trackId, type);
    if (!fx) return;
    setProject((prev) => ({
      ...prev,
      tracks: prev.tracks.map((t) =>
        t.id === trackId
          ? {
              ...t,
              fx: [...t.fx, { id: fx.id, type, enabled: true, params: defaultParams(def), previewMode: def.previewMode }],
            }
          : t
      ),
    }));
  }

  function removeEffect(trackId, fxId) {
    engineRef.current?.removeEffect(trackId, fxId);
    setProject((prev) => ({
      ...prev,
      tracks: prev.tracks.map((t) => (t.id === trackId ? { ...t, fx: t.fx.filter((f) => f.id !== fxId) } : t)),
    }));
  }

  function toggleEffect(trackId, fxId, enabled) {
    engineRef.current?.toggleEffect(trackId, fxId, enabled);
    setProject((prev) => ({
      ...prev,
      tracks: prev.tracks.map((t) =>
        t.id === trackId ? { ...t, fx: t.fx.map((f) => (f.id === fxId ? { ...f, enabled } : f)) } : t
      ),
    }));
  }

  function reorderEffect(trackId, from, to) {
    if (to < 0) return;
    engineRef.current?.reorderEffect(trackId, from, to);
    setProject((prev) => ({
      ...prev,
      tracks: prev.tracks.map((t) => {
        if (t.id !== trackId) return t;
        const fx = [...t.fx];
        if (to >= fx.length) return t;
        const [m] = fx.splice(from, 1);
        fx.splice(to, 0, m);
        return { ...t, fx };
      }),
    }));
  }

  // ---- Master --------------------------------------------------------
  function setMasterGain(v) {
    engineRef.current?.setMasterGainDb(v);
  }
  function commitMasterGain(v) {
    engineRef.current?.setMasterGainDb(v);
    setProject((prev) => ({ ...prev, master: { ...prev.master, gainDb: v } }));
  }
  function setMasterLimiter(on) {
    setProject((prev) => ({ ...prev, master: { ...prev.master, limiter: on } }));
  }

  // ---- Transporte ----------------------------------------------------
  async function handlePlay() {
    const eng = ensureEngine();
    await eng.resume();
    eng.play();
    setPlaying(true);
  }
  function handlePause() {
    engineRef.current?.pause();
    setPlaying(false);
  }
  function handleStop() {
    engineRef.current?.stop();
    setPlaying(false);
  }
  function handleSeek(t) {
    engineRef.current?.seek(t);
  }

  const getTime = () => engineRef.current?.currentTime() || 0;
  const getDuration = () => engineRef.current?.duration || 0;
  const getMasterAnalyser = () => engineRef.current?.master?.analyser || null;
  const getTrackAnalyser = (id) => engineRef.current?.tracks.find((t) => t.id === id)?.nodes.analyser || null;

  // ---- Undo / Redo ---------------------------------------------------
  function doUndo() {
    if (undoRef.current.undo()) syncHistory();
  }
  function doRedo() {
    if (undoRef.current.redo()) syncHistory();
  }

  // ---- Exportar ------------------------------------------------------
  const canExport = project.tracks.some((t) => !t.muted && t.file);

  async function handleExport() {
    const { files, payload } = serializeProject(project);
    if (files.length === 0) {
      setMessage("Adicione ao menos uma faixa não muda para exportar.");
      setMessageType("error");
      return;
    }
    setExporting(true);
    setMessage("");
    setResultUrl(null);
    try {
      const { ok, data } = await mixProject({ files, project: payload, format });
      if (!ok) {
        setMessage(data?.error || "Falha ao exportar a mixagem.");
        setMessageType("error");
      } else {
        setResultUrl(fileUrl(data.url));
        setMessage("Mixagem exportada com sucesso.");
        setMessageType("success");
      }
    } catch {
      setMessage("Erro de conexão ao exportar.");
      setMessageType("error");
    }
    setExporting(false);
  }

  return (
    <AppLayout title="Mixer" subtitle="Estação de áudio multitrack — preview ao vivo + render FFmpeg">
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        multiple
        style={{ display: "none" }}
        onChange={handleFiles}
      />

      <TransportBar
        playing={playing}
        onPlay={handlePlay}
        onPause={handlePause}
        onStop={handleStop}
        getTime={getTime}
        getDuration={getDuration}
        subscribe={subscribe}
        onAddTrackClick={() => fileInputRef.current?.click()}
        onExport={handleExport}
        exporting={exporting}
        canExport={canExport}
        onUndo={doUndo}
        onRedo={doRedo}
        canUndo={canUndo}
        canRedo={canRedo}
      />

      {message && <p className={`sc-feedback sc-feedback-${messageType}`}>{message}</p>}

      <div className="sc-daw-grid">
        <section className="sc-daw-tracks">
          {project.tracks.length === 0 && (
            <div className="sc-panel sc-daw-empty">
              <p className="sc-placeholder">
                Nenhuma faixa. Clique em <strong>+ Faixa</strong> para carregar arquivos de áudio e começar a mixar.
              </p>
            </div>
          )}

          {project.tracks.map((track) => (
            <article className="sc-panel sc-track-lane" key={track.id}>
              <div className="sc-track-head">
                <strong className="sc-track-name">{track.name}</strong>
                <button type="button" className="sc-icon-btn sc-icon-danger" onClick={() => removeTrack(track.id)}>
                  Remover
                </button>
              </div>

              <div className="sc-track-body">
                <MixerStrip
                  track={track}
                  getAnalyser={() => getTrackAnalyser(track.id)}
                  subscribe={subscribe}
                  onGain={(v) => engineRef.current?.setTrackGainDb(track.id, v)}
                  onGainCommit={(v) => commitTrackField(track.id, "gainDb", v)}
                  onPan={(v) => engineRef.current?.setTrackPan(track.id, v)}
                  onPanCommit={(v) => commitTrackField(track.id, "pan", v)}
                  onMute={(m) => commitTrackField(track.id, "muted", m)}
                />

                <div className="sc-track-main">
                  <WaveformCanvas
                    peaks={track.peaks}
                    getTime={getTime}
                    getDuration={getDuration}
                    onSeek={handleSeek}
                    subscribe={subscribe}
                    width={620}
                    height={84}
                  />
                  <FxChainPanel
                    fx={track.fx}
                    catalog={catalog}
                    onAdd={(type) => addEffect(track.id, type)}
                    onRemove={(fxId) => removeEffect(track.id, fxId)}
                    onToggle={(fxId, en) => toggleEffect(track.id, fxId, en)}
                    onReorder={(from, to) => reorderEffect(track.id, from, to)}
                    onParam={(fxId, key, v) => engineRef.current?.setEffectParam(track.id, fxId, key, v)}
                    onParamCommit={(fxId, key, v) => commitFxParam(track.id, fxId, key, v)}
                  />
                </div>
              </div>
            </article>
          ))}
        </section>

        <aside className="sc-panel sc-master-bus">
          <div className="sc-panel-head">
            <h2>Master</h2>
            <span>saída</span>
          </div>

          <div className="sc-master-meters">
            <MeterCanvas getAnalyser={getMasterAnalyser} subscribe={subscribe} height={140} />
            <div className="sc-master-controls">
              <Knob
                label="Master"
                unit="dB"
                value={project.master.gainDb}
                min={-60}
                max={12}
                step={0.5}
                onChange={setMasterGain}
                onCommit={commitMasterGain}
              />
              <label className="sc-master-limiter">
                <input
                  type="checkbox"
                  checked={project.master.limiter}
                  onChange={(e) => setMasterLimiter(e.target.checked)}
                />
                Limiter
              </label>
            </div>
          </div>

          <SpectrumCanvas getAnalyser={getMasterAnalyser} subscribe={subscribe} width={300} height={90} />

          <div className="sc-master-export">
            <label className="sc-field-label">Formato de saída</label>
            <select className="sc-input sc-input-sm" value={format} onChange={(e) => setFormat(e.target.value)}>
              {FORMATS.map((f) => (
                <option key={f} value={f}>
                  {f.toUpperCase()}
                </option>
              ))}
            </select>

            {resultUrl && (
              <div className="sc-result-box">
                <audio controls src={resultUrl} />
                <a href={resultUrl} download className="sc-btn-primary sc-inline-btn">
                  Baixar mix
                </a>
              </div>
            )}
          </div>
        </aside>
      </div>
    </AppLayout>
  );
}
