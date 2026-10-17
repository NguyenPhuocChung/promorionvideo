import { Select, Input, Space } from "antd";

type Props = {
  template: string;
  title: string;
  onTemplateChange: (value: string) => void;
  onTitleChange: (value: string) => void;
};

export default function Toolbar({ template, title, onTemplateChange, onTitleChange }: Props) {
  return (
    <Space size="middle" style={{ marginBottom: 16 }} wrap>
      <div>
        <div style={{ fontSize: 12, color: "#a1a1aa", marginBottom: 4 }}>Mẫu video</div>
        <Select
          value={template}
          onChange={onTemplateChange}
          style={{ width: 200 }}
          options={[
            { value: "intro", label: "Giới thiệu bản thân" },
            { value: "quote", label: "Câu nói truyền động lực" },
          ]}
        />
      </div>

      <div>
        <div style={{ fontSize: 12, color: "#a1a1aa", marginBottom: 4 }}>Tiêu đề video</div>
        <Input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          style={{ width: 260 }}
          placeholder="Nhập tiêu đề..."
        />
      </div>
    </Space>
  );
}