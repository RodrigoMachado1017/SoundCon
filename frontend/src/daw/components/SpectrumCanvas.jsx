import { useEffect, useRef } from "react";

// Analisador de espectro (FFT) sobre um AnalyserNode, desenhado no RAF compartilhado.
export default function SpectrumCanvas({ getAnalyser, subscribe, width = 320, height = 90 }) {
  const canvasRef = useRef(null);
  const bufRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    const draw = () => {
      const analyser = getAnalyser?.();
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "rgba(255,255,255,0.04)";
      ctx.fillRect(0, 0, width, height);
      if (!analyser) return;

      const bins = analyser.frequencyBinCount;
      if (!bufRef.current || bufRef.current.length !== bins) {
        bufRef.current = new Uint8Array(bins);
      }
      analyser.getByteFrequencyData(bufRef.current);

      // escala logarítmica simplificada: ~64 barras
      const bars = 64;
      const barW = width / bars;
      for (let i = 0; i < bars; i += 1) {
        const t = i / bars;
        const idx = Math.min(bins - 1, Math.floor(t * t * bins));
        const v = bufRef.current[idx] / 255;
        const h = v * height;
        const hue = 270 - v * 90;
        ctx.fillStyle = `hsl(${hue}, 80%, 60%)`;
        ctx.fillRect(i * barW, height - h, barW - 1, h);
      }
    };

    const unsub = subscribe(draw);
    return unsub;
  }, [getAnalyser, subscribe, width, height]);

  return <canvas ref={canvasRef} style={{ width, height, borderRadius: 8, display: "block" }} />;
}
