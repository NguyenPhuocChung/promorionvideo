import { Space, Tag, Button } from "antd";
import {  MergeCellsOutlined, CaretRightOutlined } from "@ant-design/icons";
import type { Take } from "./TakesList";

type Props = {
  takes: Take[];
  activeTakeId: string | null;
  combinedUrl: string | null;
  processing: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onMergeAll: () => void;
  onPlayCombined: () => void;
};

export default function AudioTimeline({
  takes,
  activeTakeId,
  combinedUrl,
  processing,
  onSelect,
  onDelete,
  onMergeAll,
  onPlayCombined,
}: Props) {
  if (takes.length === 0) return null;

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 13, color: "#a1a1aa" }}>
          Timeline ({takes.length} đoạn)
        </span>
        <Space size={6}>
          {takes.length >= 2 && (
            <Button
              size="small"
              icon={<MergeCellsOutlined />}
              onClick={onMergeAll}
              loading={processing}
            >
              Ghép
            </Button>
          )}
          {combinedUrl && (
            <Button size="small" icon={<CaretRightOutlined />} onClick={onPlayCombined}>
              Nghe hết
            </Button>
          )}
        </Space>
      </div>

      <Space size={[6, 6]} wrap>
        {takes.map((take, index) => (
          <Tag
            key={take.id}
            color={take.id === activeTakeId ? "purple" : "default"}
            style={{
              cursor: "pointer",
              padding: "4px 10px",
              fontSize: 13,
              borderWidth: take.id === activeTakeId ? 2 : 1,
            }}
            onClick={() => onSelect(take.id)}
            closable
            onClose={(e) => {
              e.preventDefault();
              onDelete(take.id);
            }}
          >
            {index + 1}. {take.name}
          </Tag>
        ))}
      </Space>
    </div>
  );
}