import { useEffect, useRef, useState } from "react";
import { Card, Button, Space, Select, Typography, message } from "antd";
import { ScissorOutlined, ClearOutlined, SoundOutlined, DashboardOutlined } from "@ant-design/icons";
import WaveSurfer from "wavesurfer.js";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.esm.js";
import {
  decodeAudioData,
  audioBufferToWav,
  sliceAudioBuffer,
  removeSilence,
  changeSpeed,
  mergeAudioBuffers,
} from "../../utils/audioUtils";
import type { Take } from "./TakesList";

const { Text } = Typography;

type Props = {
  take: Take;
  processing: boolean;
  onProcessed: (blob: Blob, name: string) => void;
  setProcessing: (v: boolean) => void;
  setStatus: (msg: string) => void;
  setError: (msg: string) => void;
};

export default function SegmentEditor({
  take,
  processing,
  onProcessed,
  setProcessing,
  setStatus,
  setError,
}: Props) {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const regionsRef = useRef<any>(null);
  const [speed, setSpeed] = useState(1);
  const [regionCount, setRegionCount] = useState(0);

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
      height: 80,
      barWidth: 2,
      barGap: 1.5,
      barRadius: 2,
      url: take.url,
      plugins: [regions],
    });

    ws.on("ready", () => {
      regions.clearRegions();
      setRegionCount(0);
    });

    regions.enableDragSelection({
      color: "rgba(139, 92, 246, 0.35)",
    });

    const updateCount = () => setRegionCount(regions.getRegions().length);
    regions.on("region-created", updateCount);
    regions.on("region-updated", updateCount);
    regions.on("region-removed", updateCount);

    wavesurferRef.current = ws;

    return () => ws.destroy();
  }, [take.id, take.url]);

  async function handleKeepSelectedRegions() {
    if (!regionsRef.current) return;
    const regions = regionsRef.current.getRegions();
    if (regions.length === 0) {
      message.warning("Hãy kéo chọn ít nhất 1 vùng muốn giữ");
      return;
    }

    setProcessing(true);
    try {
      const sorted = [...regions].sort((a: any, b: any) => a.start - b.start);
      const buffer = await decodeAudioData(take.blob);
      const slices: AudioBuffer[] = [];

      for (const region of sorted) {
        if (region.end - region.start < 0.05) continue;
        slices.push(sliceAudioBuffer(buffer, region.start, region.end));
      }

      if (slices.length === 0) {
        message.error("Các vùng chọn quá ngắn");
        return;
      }

      const merged = await mergeAudioBuffers(slices);
      const wav = audioBufferToWav(merged);
      onProcessed(wav, `${take.name} (đã cắt)`);
      setStatus(`Đã giữ ${slices.length} vùng và ghép lại`);
      message.success("Cắt thành công");
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
      onProcessed(wav, `${take.name} (xóa lặng)`);
      setStatus("Đã xóa khoảng lặng");
      message.success("Đã xóa khoảng lặng");
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
      onProcessed(wav, `${take.name} (${speed}x)`);
      setStatus(`Đã đổi tốc độ thành ${speed}x`);
      message.success(`Đã đổi tốc độ ${speed}x`);
    } catch (e) {
      setError(String(e));
    } finally {
      setProcessing(false);
    }
  }

  return (
    <Card
      size="small"
      title={`Chỉnh đoạn: ${take.name}`}
      extra={
        <Button size="small" icon={<SoundOutlined />} onClick={() => wavesurferRef.current?.playPause()}>
          Nghe
        </Button>
      }
      style={{ marginBottom: 12 }}
    >
      <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 8 }}>
        Kéo chuột trên waveform để chọn những phần <strong>muốn giữ</strong>. Có thể chọn nhiều vùng.
      </Text>

      <div ref={waveformRef} style={{ background: "#09090b", borderRadius: 6, marginBottom: 12 }} />

      <div style={{ marginBottom: 12, fontSize: 13 }}>
        {regionCount > 0 ? (
          <Text>
            Đã chọn <Text strong>{regionCount}</Text> vùng
          </Text>
        ) : (
          <Text type="secondary">Chưa chọn vùng nào</Text>
        )}
      </div>

      <Space wrap>
        <Button
          type="primary"
          icon={<ScissorOutlined />}
          onClick={handleKeepSelectedRegions}
          loading={processing}
          disabled={regionCount === 0}
        >
          Chỉ giữ vùng đã chọn
        </Button>

        <Button icon={<ClearOutlined />} onClick={handleRemoveSilence} loading={processing}>
          Xóa khoảng lặng
        </Button>

        <Space>
          <Select
            value={speed}
            onChange={setSpeed}
            style={{ width: 90 }}
            options={[
              { value: 0.75, label: "0.75x" },
              { value: 0.9, label: "0.9x" },
              { value: 1, label: "1x" },
              { value: 1.1, label: "1.1x" },
              { value: 1.25, label: "1.25x" },
              { value: 1.5, label: "1.5x" },
            ]}
          />
          <Button icon={<DashboardOutlined />} onClick={handleChangeSpeed} loading={processing}>
            Áp dụng tốc độ
          </Button>
        </Space>
      </Space>
    </Card>
  );
}