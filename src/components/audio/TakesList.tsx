export type Take = {
  id: string;
  url: string;
  blob: Blob;
  name: string;
};
type Props = {
  takes: Take[];
  activeTakeId: string | null;
  processing: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onMergeAll: () => void;
};

export default function TakesList({
  takes,
  activeTakeId,
  processing,
  onSelect,
  onDelete,
  onMergeAll,
}: Props) {
  if (takes.length === 0) return null;

  return (
    <div className="tool-block">
      <div className="tool-header">
        <h3>📂 Bản thu ({takes.length})</h3>
        {takes.length >= 2 && (
          <button className="btn-small" onClick={onMergeAll} disabled={processing}>
            Ghép tất cả
          </button>
        )}
      </div>

      <div className="takes-list">
        {takes.map((t) => (
          <div
            key={t.id}
            className={`take-item ${t.id === activeTakeId ? "active" : ""}`}
            onClick={() => onSelect(t.id)}
          >
            <span className="take-name">{t.name}</span>
            <button
              className="btn-icon"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(t.id);
              }}
              title="Xóa"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}