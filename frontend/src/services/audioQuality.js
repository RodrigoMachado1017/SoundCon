// Opções de qualidade espelhando as whitelists do backend (audioProcessing.service.js).
export const SAMPLE_RATES = [44100, 48000, 96000];
export const BITRATES = [96, 128, 160, 192, 256, 320];
export const BIT_DEPTHS = [16, 24, 32];

const LOSSY = ["mp3", "aac", "ogg", "opus", "m4a"];
const BITDEPTH_FORMATS = ["wav", "flac"];

export const isLossy = (format) => LOSSY.includes(format);
export const hasBitDepth = (format) => BITDEPTH_FORMATS.includes(format);
