import { useEffect, useRef } from "react";

// Forma de onda em duas camadas: base (desenhada quando os picos/tamanho mudam)
// + overlay do cursor de reprodução (redesenhado a cada frame no RAF).
export default function WaveformCanvas({
  peaks,
  getTime,
  getDuration,
  onSeek,
  subscribe,
  width = 640,
  height = 96,
}) {
  const baseRef = useRef(null);
  const overlayRef = useRef(null);

  // Camada base: redesenha só quando os picos mudam.
  useEffect(() => {
    const canvas = baseRef.current;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = "rgba(255,255,255,0.04)";
    ctx.fillRect(0, 0, width, height);

    if (!peaks) return;
    const { min, max } = peaks;
    const n = min.length;
    const mid = height / 2;
    ctx.fillStyle = "#9a53ff";
    for (let x = 0; x < width; x += 1) {
      const b = Math.floor((x / width) * n);
      const lo = min[b] || 0;
      const hi = max[b] || 0;
      const y1 = mid - hi * mid;
      const y2 = mid - lo * mid;
      ctx.fillRect(x, y1, 1, Math.max(1, y2 - y1));
    }
  }, [peaks, width, height]);

  // Camada de cursor: a cada frame, só a linha fina é redesenhada.
  useEffect(() => {
    const canvas = overlayRef.current;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const dur = getDuration?.() || 0;
      if (dur <= 0) return;
      const t = getTime?.() || 0;
      const x = (t / dur) * width;
      ctx.fillStyle = "#f7f2ff";
      ctx.fillRect(x, 0, 2, height);
    };

    const unsub = subscribe(draw);
    return unsub;
  }, [getTime, getDuration, subscribe, width, height]);

  function handleClick(e) {
    const rect = overlayRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const dur = getDuration?.() || 0;
    onSeek?.((x / rect.width) * dur);
  }

  return (
    <div className="sc-waveform" style={{ width, height }}>
      <canvas ref={baseRef} style={{ width, height }} />
      <canvas ref={overlayRef} style={{ width, height }} onClick={handleClick} />
    </div>
  );
}
