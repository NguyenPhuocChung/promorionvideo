
import { useRef } from "react";
import { Player } from "@remotion/player";
import type { BrowserComposition } from "@remotion/browser-bundler/runtime";
import RecordingControls from "./audio/RecordingControls";
import TakesList, { type Take } from "./audio/TakesList";
import AudioEditor from "./audio/AudioEditor";

type Props = {
  composition: BrowserComposition | null;
  busy: boolean;
  isRecording: boolean;
  progress: number;
  status: string;
  error: string;
  takes: Take[];
  activeTakeId: string | null;
  processing: boolean;
  audioUrl: string | null;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onSelectTake: (id: string) => void;
  onDeleteTake: (id: string) => void;
  onMergeAll: () => void;
  onProcessed: (blob: Blob, name: string) => void;
  onUseAsFinal: () => void;
  setProcessing: (v: boolean) => void;
  setStatus: (msg: string) => void;
  setError: (msg: string) => void;
  onCompile: () => void;
  onExport: () => void;
  // upload
  onUploadAudio: (file: File | undefined) => void;
  onUploadImage: (file: File | undefined) => void;
  onUploadVideo: (file: File | undefined) => void;
};

export default function PreviewPanel({
  composition,
  busy,
  isRecording,
  progress,
  status,
  error,
  takes,
  activeTakeId,
  processing,
  onStartRecording,
  onStopRecording,
  onSelectTake,
  onDeleteTake,
  onMergeAll,
  onProcessed,
  onUseAsFinal,
  setProcessing,
  setStatus,
  setError,
  onCompile,
  onExport,
  onUploadAudio,
  onUploadImage,
  onUploadVideo,
}: Props) {
  const playerRef = useRef<any>(null);

  // Expose playerRef ra ngoài nếu cần (thông qua callback hoặc context)
  // Ở đây tạm thời gắn vào window để RecordingControls dùng được
  (window as any).__playerRef = playerRef;

  const activeTake = takes.find((t) => t.id === activeTakeId) || null;

  return (
    <div className="preview panel">
      <h2>02 / XEM TRƯỚC & THU ÂM</h2>

      <div className="player">
        {composition ? (
          <Player
            ref={playerRef}
            acknowledgeRemotionLicense
            component={composition.component}
            inputProps={composition.props}
            durationInFrames={composition.durationInFrames}
            fps={composition.fps}
            compositionWidth={composition.width}
            compositionHeight={composition.height}
            controls
            style={{ width: "100%" }}
          />
        ) : (
          <div className="empty">
            <span>▶</span>
            <p>Nhấn "Biên dịch khung hình video" để khởi tạo</p>
          </div>
        )}
      </div>

      {/* Thu âm */}
      <RecordingControls
        isRecording={isRecording}
        busy={busy}
        hasComposition={!!composition}
        onStart={onStartRecording}
        onStop={onStopRecording}
      />

      {/* Danh sách bản thu */}
      <TakesList
        takes={takes}
        activeTakeId={activeTakeId}
        processing={processing}
        onSelect={onSelectTake}
        onDelete={onDeleteTake}
        onMergeAll={onMergeAll}
      />

      {/* Waveform + công cụ */}
      {activeTake && (
        <AudioEditor
          take={activeTake}
          processing={processing}
          onProcessed={onProcessed}
          onUseAsFinal={onUseAsFinal}
          setProcessing={setProcessing}
          setStatus={setStatus}
          setError={setError}
        />
      )}

      {/* Tài nguyên khác */}
      <div className="tool-block">
        <div className="tool-header">
          <h3>04 / Tài nguyên khác</h3>
        </div>
        <div className="assets">
          <label>
            Tải audio có sẵn (mp3/wav)
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => onUploadAudio(e.target.files?.[0])}
            />
          </label>
          <label>
            Tải ảnh nền
            <input
              type="file"
              accept="image/*"
              onChange={(e) => onUploadImage(e.target.files?.[0])}
            />
          </label>
          <label>
            Tải video nền
            <input
              type="file"
              accept="video/*"
              onChange={(e) => onUploadVideo(e.target.files?.[0])}
            />
          </label>
        </div>
      </div>

      {/* Nút kết hợp + xuất */}
      <div className="export-actions">
        <button
          className="btn-primary"
          disabled={busy || isRecording}
          onClick={onCompile}
          style={{ backgroundColor: "#059669" }}
        >
          🔄 Kết hợp Âm thanh vào Video
        </button>

        <button
          className="btn-export"
          disabled={busy || !composition || isRecording}
          onClick={onExport}
        >
          {busy ? `Đang kết xuất ${progress}%` : "🎬 Xuất video MP4 hoàn chỉnh"}
        </button>
      </div>

      {busy && (
        <progress value={progress} max={100} style={{ width: "100%", marginTop: 10 }} />
      )}

      <p className="status">{status}</p>
      {error && <pre className="error">{error}</pre>}
    </div>
  );
}