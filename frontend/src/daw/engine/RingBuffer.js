// Buffer circular sobre Float32Array. Escrita O(1) sem realocação — usado para
// o histórico dos medidores (escrito na taxa de áudio, lido no RAF).
export default class RingBuffer {
  constructor(size) {
    this.size = size;
    this.data = new Float32Array(size);
    this.head = 0;
    this.count = 0;
  }

  push(value) {
    this.data[this.head] = value;
    this.head = (this.head + 1) % this.size;
    if (this.count < this.size) this.count += 1;
  }

  // Maior valor recente numa janela (para peak-hold dos medidores).
  max(window = this.size) {
    const n = Math.min(window, this.count);
    let m = 0;
    for (let i = 0; i < n; i += 1) {
      const idx = (this.head - 1 - i + this.size) % this.size;
      const v = this.data[idx];
      if (v > m) m = v;
    }
    return m;
  }

  clear() {
    this.data.fill(0);
    this.head = 0;
    this.count = 0;
  }
}
