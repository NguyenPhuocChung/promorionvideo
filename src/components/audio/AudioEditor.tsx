import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.esm.js";
import {
  decodeAudioData,
  audioBufferToWav,
  sliceAudioBuffer,
  removeSilence,
  changeSpeed,
} from "../../utils/audioUtils";
import type { Take } from "./TakesList";

type Props = {
  take: Take;
  processing: boolean;
  onProcessed: (blob: Blob, name: string) => void;
  onUseAsFinal: () => void;
  setProcessing: (v: boolean) => void;
  setStatus: (msg: string) => void;
  setError: (msg: string) => void;
};

export default function AudioEditor({
  take,
  processing,
  onProcessed,
  onUseAsFinal,
  setProcessing,
  setStatus,
  setError,
}: Props) {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const regionsRef = useRef<any>(null);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    if (!waveformRef.current) return;

    wavesurferRef.current?.destroy();

    const regions = RegionsPlugin.create();
    regionsRef.current = regions;

    const ws = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: "#c4b5fd",
      progressColor: "#8b5cf6",
      cursorColor: "#f472b6",
      height: 88,
      barWidth: 2,
      barGap: 1.5,
      barRadius: 2,
      url: take.url,
      plugins: [regions],
    });

    ws.on("ready", () => {
      regions.clearRegions();
      regions.addRegion({
        start: 0,
        end: ws.getDuration(),
        color: "rgba(139, 92, 246, 0.25)",
        drag: true,
        resize: true,
      });
    });

    regions.enableDragSelection({
      color: "rgba(244, 114, 182, 0.28)",
    });

    wavesurferRef.current = ws;

    return () => {
      ws.destroy();
    };
  }, [take.id, take.url]);

  async function handleCut() {
    if (!wavesurferRef.current || !regionsRef.current) return;
    setProcessing(true);
    try {
      const regions = regionsRef.current.getRegions();
      if (!regions.length) {
        setError("Hãy chọn vùng cần giữ trên waveform.");
        return;
      }
      const region = regions.sort(
        (a: any, b: any) => b.end - b.start - (a.end - a.start)
      )[0];

      const buffer = await decodeAudioData(take.blob);
      const sliced = sliceAudioBuffer(buffer, region.start, region.end);
      const wav = audioBufferToWav(sliced);
      onProcessed(wav, "Đã cắt");
      setStatus("Đã cắt theo vùng chọn.");
    } catch (e) {
      setError(String(e));
    } finally {
      setProcessing(false);
    }
  }

  async function handleRemoveSilence() {
    setProcessing(true);
    try {
      const buffer = await decodeAudioData(take.blob);
      const cleaned = removeSilence(buffer);
      const wav = audioBufferToWav(cleaned);
      onProcessed(wav, "Đã xóa khoảng lặng");
      setStatus("Đã xóa khoảng lặng.");
    } catch (e) {
      setError(String(e));
    } finally {
      setProcessing(false);
    }
  }

  async function handleChangeSpeed() {
    setProcessing(true);
    try {
      const buffer = await decodeAudioData(take.blob);
      const changed = await changeSpeed(buffer, speed);
      const wav = audioBufferToWav(changed);
      onProcessed(wav, `Tốc độ ${speed}x`);
      setStatus(`Đã đổi tốc độ thành ${speed}x`);
    } catch (e) {
      setError(String(e));
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="tool-block">
      <div className="tool-header">
        <h3>🌊 Chỉnh sửa: {take.name}</h3>
      </div>

      <div ref={waveformRef} className="waveform" />

      <div className="audio-actions">
        <button className="btn-secondary" onClick={handleCut} disabled={processing}>
          Cắt vùng đang chọn
        </button>
        <button
          className="btn-secondary"
          onClick={handleRemoveSilence}
          disabled={processing}
        >
          Xóa khoảng lặng
        </button>

        <div className="speed-control">
          <label>
            Tốc độ:
            <select
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              disabled={processing}
            >
              <option value={0.75}>0.75x</option>
              <option value={0.9}>0.9x</option>
              <option value={1}>1x</option>
              <option value={1.1}>1.1x</option>
              <option value={1.25}>1.25x</option>
              <option value={1.5}>1.5x</option>
            </select>
          </label>
          <button
            className="btn-secondary"
            onClick={handleChangeSpeed}
            disabled={processing}
          >
            Áp dụng tốc độ
          </button>
        </div>
      </div>

      <button className="btn-success" onClick={onUseAsFinal} disabled={processing}>
        ✅ Dùng bản này làm audio chính
      </button>
    </div>
  );
}