export async function decodeAudioData(blob: Blob): Promise<AudioBuffer> {
  const arrayBuffer = await blob.arrayBuffer();
  const ctx = new AudioContext();
  const buffer = await ctx.decodeAudioData(arrayBuffer);
  await ctx.close();
  return buffer;
}

export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const dataLength = buffer.length * blockAlign;
  const arrayBuffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(36, "data");
  view.setUint32(40, dataLength, true);

  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}

export function sliceAudioBuffer(
  buffer: AudioBuffer,
  startSec: number,
  endSec: number
): AudioBuffer {
  const sampleRate = buffer.sampleRate;
  const start = Math.floor(startSec * sampleRate);
  const end = Math.floor(endSec * sampleRate);
  const length = Math.max(0, end - start);

  const newBuffer = new OfflineAudioContext(
    buffer.numberOfChannels,
    length,
    sampleRate
  ).createBuffer(buffer.numberOfChannels, length, sampleRate);

  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const data = buffer.getChannelData(ch).subarray(start, end);
    newBuffer.copyToChannel(data, ch);
  }
  return newBuffer;
}

export function removeSilence(
  buffer: AudioBuffer,
  threshold = 0.018,
  minSilenceSec = 0.22
): AudioBuffer {
  const sampleRate = buffer.sampleRate;
  const data = buffer.getChannelData(0);
  const minSilenceSamples = Math.floor(minSilenceSec * sampleRate);
  const ranges: [number, number][] = [];
  let i = 0;

  while (i < data.length) {
    while (i < data.length && Math.abs(data[i]) < threshold) i++;
    if (i >= data.length) break;
    const start = i;
    while (i < data.length && Math.abs(data[i]) >= threshold) i++;
    ranges.push([start, i]);
  }

  if (ranges.length === 0) return buffer;

  const merged: [number, number][] = [];
  let [cs, ce] = ranges[0];
  for (let k = 1; k < ranges.length; k++) {
    const [s, e] = ranges[k];
    if (s - ce < minSilenceSamples) ce = e;
    else {
      merged.push([cs, ce]);
      cs = s;
      ce = e;
    }
  }
  merged.push([cs, ce]);

  const totalLength = merged.reduce((sum, [s, e]) => sum + (e - s), 0);
  const newBuffer = new OfflineAudioContext(
    buffer.numberOfChannels,
    totalLength,
    sampleRate
  ).createBuffer(buffer.numberOfChannels, totalLength, sampleRate);

  let offset = 0;
  for (const [s, e] of merged) {
    for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
      newBuffer.getChannelData(ch).set(buffer.getChannelData(ch).subarray(s, e), offset);
    }
    offset += e - s;
  }
  return newBuffer;
}

export async function changeSpeed(
  buffer: AudioBuffer,
  rate: number
): Promise<AudioBuffer> {
  if (Math.abs(rate - 1) < 0.01) return buffer;

  const newLength = Math.floor(buffer.length / rate);
  const offline = new OfflineAudioContext(
    buffer.numberOfChannels,
    newLength,
    buffer.sampleRate
  );
  const source = offline.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = rate;
  source.connect(offline.destination);
  source.start();
  return offline.startRendering();
}

export async function mergeAudioBuffers(
  buffers: AudioBuffer[]
): Promise<AudioBuffer> {
  if (buffers.length === 0) throw new Error("Không có dữ liệu");
  if (buffers.length === 1) return buffers[0];

  const sampleRate = buffers[0].sampleRate;
  const numChannels = buffers[0].numberOfChannels;
  const totalLength = buffers.reduce((s, b) => s + b.length, 0);

  const output = new OfflineAudioContext(
    numChannels,
    totalLength,
    sampleRate
  ).createBuffer(numChannels, totalLength, sampleRate);

  let offset = 0;
  for (const buf of buffers) {
    for (let ch = 0; ch < numChannels; ch++) {
      output.getChannelData(ch).set(buf.getChannelData(ch), offset);
    }
    offset += buf.length;
  }
  return output;
}