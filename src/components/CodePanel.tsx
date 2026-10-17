import { Card, Button, Input } from "antd";
import { CodeOutlined } from "@ant-design/icons";

const { TextArea } = Input;

type Props = {
  code: string;
  busy: boolean;
  isRecording: boolean;
  onCodeChange: (value: string) => void;
  onCompile: () => void;
};

export default function CodePanel({ code, busy, isRecording, onCodeChange, onCompile }: Props) {
  return (
    <Card
      title={
        <span>
          <CodeOutlined /> Code Editor
        </span>
      }
      size="small"
      style={{ marginBottom: 16 }}
      extra={
        <Button type="primary" loading={busy} disabled={isRecording} onClick={onCompile}>
          Biên dịch khung hình
        </Button>
      }
    >
      <TextArea
        value={code}
        onChange={(e) => onCodeChange(e.target.value)}
        autoSize={{ minRows: 6, maxRows: 10 }}
        spellCheck={false}
        style={{
          fontFamily: "monospace",
          fontSize: 13,
          background: "#09090b",
          color: "#e4e4e7",
        }}
      />
    </Card>
  );
}