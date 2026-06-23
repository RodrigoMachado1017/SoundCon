// Extrai picos min/max por bucket (coluna de pixel) fora da main thread.
// Recebe o Float32Array do canal (ArrayBuffer transferível) e devolve os picos
// também por transferência (zero-copy).
self.onmessage = (e) => {
  const { channel, buckets } = e.data;
  const data = new Float32Array(channel);
  const len = data.length;
  const n = Math.max(1, buckets | 0);
  const min = new Float32Array(n);
  const max = new Float32Array(n);
  const per = Math.max(1, Math.floor(len / n));

  for (let b = 0; b < n; b += 1) {
    const start = b * per;
    const end = b === n - 1 ? len : Math.min(len, start + per);
    let lo = 1;
    let hi = -1;
    for (let i = start; i < end; i += 1) {
      const v = data[i];
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    }
    if (end <= start) {
      lo = 0;
      hi = 0;
    }
    min[b] = lo;
    max[b] = hi;
  }

  self.postMessage({ min, max }, [min.buffer, max.buffer]);
};
