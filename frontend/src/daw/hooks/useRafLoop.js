import { useEffect, useRef } from "react";

// Loop único de requestAnimationFrame compartilhado por toda a página.
// Throttle adaptativo: se o tempo médio de frame piora (PC fraco), cai para ~30fps.
// Os callbacks registrados desenham direto no canvas (sem setState).
export function useRafLoop() {
  const callbacks = useRef(new Set());
  const frameAvg = useRef(16);
  const lastTs = useRef(0);
  const lastDraw = useRef(0);

  useEffect(() => {
    let raf = 0;
    let prev = 0;

    const tick = (ts) => {
      raf = requestAnimationFrame(tick);
      if (prev) {
        const dt = ts - prev;
        // média móvel exponencial do tempo de frame
        frameAvg.current = frameAvg.current * 0.9 + dt * 0.1;
      }
      prev = ts;

      // Se o aparelho está lento, limita a taxa de desenho a ~30fps.
      const minInterval = frameAvg.current > 22 ? 33 : 0;
      if (ts - lastDraw.current < minInterval) return;
      lastDraw.current = ts;

      lastTs.current = ts;
      callbacks.current.forEach((cb) => {
        try {
          cb(ts);
        } catch {
          /* um callback com erro não derruba o loop */
        }
      });
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const subscribe = (cb) => {
    callbacks.current.add(cb);
    return () => callbacks.current.delete(cb);
  };

  return { subscribe, frameAvg };
}
