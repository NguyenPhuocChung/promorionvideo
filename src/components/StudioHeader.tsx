import { Typography, Tag, Space } from "antd";

const { Title, Text } = Typography;

export default function StudioHeader() {
    return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
                <Title level={3} style={{ margin: 0 }}>
                    Làm video bằng ý tưởng của bạn
                </Title>
                <Text type="secondary">Thu âm · Waveform · Cắt · Ghép · Đổi tốc độ · Xuất MP4</Text>
            </div>
            <Tag color="purple">LOCAL STUDIO</Tag>
        </div>
    );
}