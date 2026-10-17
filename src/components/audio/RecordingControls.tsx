import  { AudioOutlined } from "@ant-design/icons";
import { Button } from "antd";

type Props = {
  isRecording: boolean;
  busy: boolean;
  hasComposition: boolean;
  onStart: () => void;
  onStop: () => void;
};

export default function RecordingControls({
  isRecording,
  busy,
  hasComposition,
  onStart,
  onStop,
}: Props) {
  return (
    <div className="tool-block">
      <div className="tool-header">
        <h3><AudioOutlined /> Thu âm lồng tiếng</h3>
      </div>
      <p className="hint">
        Video sẽ tự chạy khi bắt đầu thu. Bạn có thể thu nhiều lần rồi chọn bản đẹp nhất.
      </p>

      {!isRecording ? (
        <Button
          className="btn-primary"
          disabled={busy || !hasComposition}
          onClick={onStart}
        >
          Bắt đầu thu âm
        </Button>
      ) : (
        <Button  className="btn-danger" onClick={onStop}>
          ⏹️ Dừng thu âm
        </Button>
      )}
    </div>
  );
}