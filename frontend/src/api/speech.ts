/**
 * Convert an audio Blob (webm/mp4/ogg) to 16kHz mono 16-bit PCM WAV.
 * Uses the browser's AudioContext decoder — no server-side ffmpeg needed.
 */
async function convertToWav(audioBlob: Blob): Promise<Blob> {
  const ctx = new AudioContext({ sampleRate: 16000 });
  try {
    const buffer = await ctx.decodeAudioData(await audioBlob.arrayBuffer());

    // Downmix to mono
    const length = buffer.length;
    const mono = new Float32Array(length);
    for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
      const data = buffer.getChannelData(ch);
      for (let i = 0; i < length; i++) mono[i] += data[i];
    }
    const scale = 1 / buffer.numberOfChannels;
    for (let i = 0; i < length; i++) mono[i] *= scale;

    // Encode as 16-bit PCM WAV
    const wavBuffer = new ArrayBuffer(44 + length * 2);
    const view = new DataView(wavBuffer);
    const writeStr = (off: number, s: string) => {
      for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
    };
    writeStr(0, 'RIFF');
    view.setUint32(4, 36 + length * 2, true);
    writeStr(8, 'WAVE');
    writeStr(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, 16000, true);
    view.setUint32(28, 32000, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeStr(36, 'data');
    view.setUint32(40, length * 2, true);
    for (let i = 0; i < length; i++) {
      const s = Math.max(-1, Math.min(1, mono[i]));
      view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }

    return new Blob([wavBuffer], { type: 'audio/wav' });
  } finally {
    ctx.close();
  }
}

export async function transcribeSpeech(audioBlob: Blob): Promise<string> {
  const wav = await convertToWav(audioBlob);
  const formData = new FormData();
  formData.append('file', wav, 'recording.wav');

  const res = await fetch('/api/speech', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Speech recognition failed: ${res.status}`);
  }

  const data = await res.json();
  return data.text;
}