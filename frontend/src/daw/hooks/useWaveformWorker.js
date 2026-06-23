import { useEffect, useRef } from "react";

// Wrapper do Web Worker de extração de picos. Reaproveita um único worker.
export function useWaveformWorker() {
  const workerRef = useRef(null);

  useEffect(() => {
    const worker = new Worker(new URL("../workers/waveformWorker.js", import.meta.url), {
      type: "module",
    });
    workerRef.current = worker;
    return () => worker.terminate();
  }, []);

  // Calcula picos min/max para `buckets` colunas a partir de um AudioBuffer.
  function computePeaks(audioBuffer, buckets) {
    return new Promise((resolve) => {
      const worker = workerRef.current;
      if (!worker) return resolve(null);
      // Mistura para mono (primeiro canal já basta para a forma de onda).
      const channel = audioBuffer.getChannelData(0).slice();
      const onMsg = (e) => {
        worker.removeEventListener("message", onMsg);
        resolve(e.data); // { min, max }
      };
      worker.addEventListener("message", onMsg);
      worker.postMessage({ channel: channel.buffer, buckets }, [channel.buffer]);
      return undefined;
    });
  }

  return { computePeaks };
}
