// Utilitários de medição/conversão de nível.

export const dbToLin = (db) => 10 ** (db / 20);
export const linToDb = (lin) => (lin > 0 ? 20 * Math.log10(lin) : -Infinity);

// RMS de um bloco de amostras (Float32Array no domínio do tempo, -1..1).
export function rms(samples) {
  let sum = 0;
  for (let i = 0; i < samples.length; i += 1) sum += samples[i] * samples[i];
  return Math.sqrt(sum / samples.length);
}

// Pico absoluto de um bloco.
export function peak(samples) {
  let m = 0;
  for (let i = 0; i < samples.length; i += 1) {
    const a = Math.abs(samples[i]);
    if (a > m) m = a;
  }
  return m;
}

// Mapeia dB (faixa -60..0) para 0..1 para desenhar o medidor.
export function dbToMeterFraction(db, floor = -60) {
  if (!Number.isFinite(db)) return 0;
  if (db <= floor) return 0;
  if (db >= 0) return 1;
  return (db - floor) / -floor;
}
