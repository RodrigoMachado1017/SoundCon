import { useEffect, useRef } from "react";
import { peak as peakOf, linToDb, dbToMeterFraction } from "../engine/meters";

// Medidor de nível (VU/pico) desenhado em canvas, alimentado por um AnalyserNode.
// Lê no RAF compartilhado; mantém peak-hold e indicador de clip. Sem setState.
export default function MeterCanvas({ getAnalyser, subscribe, width = 14, height = 120 }) {
  const canvasRef = useRef(null);
  const bufRef = useRef(null);
  const holdRef = useRef(0);
  const clipRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    const draw = () => {
      const analyser = getAnalyser?.();
      let frac = 0;
      let db = -Infinity;
      if (analyser) {
        if (!bufRef.current || bufRef.current.length !== analyser.fftSize) {
          bufRef.current = new Float32Array(analyser.fftSize);
        }
        analyser.getFloatTimeDomainData(bufRef.current);
        const p = peakOf(bufRef.current);
        db = linToDb(p);
        frac = dbToMeterFraction(db);
        if (p >= 0.999) clipRef.current = 1;
      }
      // peak-hold com decaimento
      holdRef.current = Math.max(holdRef.current * 0.96, frac);

      ctx.clearRect(0, 0, width, height);
      // trilho
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.fillRect(0, 0, width, height);
      // barra
      const barH = frac * height;
      const grad = ctx.createLinearGradient(0, height, 0, 0);
      grad.addColorStop(0, "#22c55e");
      grad.addColorStop(0.7, "#9a53ff");
      grad.addColorStop(0.9, "#fb923c");
      grad.addColorStop(1, "#fb7185");
      ctx.fillStyle = grad;
      ctx.fillRect(0, height - barH, width, barH);
      // marca de peak-hold
      const holdY = height - holdRef.current * height;
      ctx.fillStyle = "#f7f2ff";
      ctx.fillRect(0, holdY - 1, width, 2);
      // clip
      if (clipRef.current) {
        ctx.fillStyle = "#fb7185";
        ctx.fillRect(0, 0, width, 4);
      }
    };

    const unsub = subscribe(draw);
    return unsub;
  }, [getAnalyser, subscribe, width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height, borderRadius: 4, cursor: "pointer" }}
      title="Clique para resetar clip"
      onClick={() => {
        clipRef.current = 0;
      }}
    />
  );
}
