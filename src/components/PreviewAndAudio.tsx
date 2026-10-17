import { useRef } from "react";
import { Player } from "@remotion/player";
import type { BrowserComposition } from "@remotion/browser-bundler/runtime";
import {
    Card,
    Button,
    Upload,
    Space,
    Progress,
    Alert,
    Typography,
} from "antd";
import {
    VideoCameraOutlined,
    SoundOutlined,
    PictureOutlined,
    ExportOutlined,
    SyncOutlined,
    PlayCircleOutlined,
} from "@ant-design/icons";

import RecordingControls from "./audio/RecordingControls";
import AudioTimeline from "./audio/AudioTimeline";
import SegmentEditor from "./audio/SegmentEditor";
import type { Take } from "./audio/TakesList";

const { Text } = Typography;

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
    combinedUrl: string | null;
    audioUrl: string | null;
    imageUrl: string | null;
    videoUrl: string | null;
    audioName: string | null;
    imageName: string | null;
    videoName: string | null;
    onStartRecording: () => void;
    onStopRecording: () => void;
    onSelectTake: (id: string) => void;
    onDeleteTake: (id: string) => void;
    onMergeAll: () => void;
    onProcessed: (blob: Blob, name: string) => void;
    onPlayCombined: () => void;
    setProcessing: (v: boolean) => void;
    setStatus: (msg: string) => void;
    setError: (msg: string) => void;
    onCompile: () => void;
    onExport: () => void;
    onUploadAudio: (file: File | undefined) => void;
    onUploadImage: (file: File | undefined) => void;
    onUploadVideo: (file: File | undefined) => void;
};

export default function PreviewAndAudio(props: Props) {
    const {
        composition,
        busy,
        isRecording,
        progress,
        status,
        error,
        takes,
        activeTakeId,
        processing,
        combinedUrl,
        audioUrl,
        imageUrl,
        videoUrl,
        audioName,
        imageName,
        videoName,
        onStartRecording,
        onStopRecording,
        onSelectTake,
        onDeleteTake,
        onMergeAll,
        onProcessed,
        onPlayCombined,
        setProcessing,
        setStatus,
        setError,
        onCompile,
        onExport,
        onUploadAudio,
        onUploadImage,
        onUploadVideo,
    } = props;

    const playerRef = useRef<any>(null);
    (window as any).__playerRef = playerRef;

    const activeTake = takes.find((t) => t.id === activeTakeId) || null;

    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
            }}
        >
            {/* CỘT TRÁI - VIDEO */}
            <Card
                title={
                    <span>
                        <VideoCameraOutlined /> Xem trước Video
                    </span>
                }
                size="small"
            >
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
                            <span style={{ fontSize: 32 }}><PlayCircleOutlined /></span>
                            <Text type="secondary">
                                Nhấn "Biên dịch khung hình" ở phía trên
                            </Text>
                        </div>
                    )}
                </div>
            </Card>

            {/* CỘT PHẢI - AUDIO */}
            <div>
                <Card
                    title={
                        <span>
                            <SoundOutlined /> Thu âm & Chỉnh sửa
                        </span>
                    }
                    size="small"
                    style={{ marginBottom: 12 }}
                >
                    <RecordingControls
                        isRecording={isRecording}
                        busy={busy}
                        hasComposition={!!composition}
                        onStart={onStartRecording}
                        onStop={onStopRecording}
                    />

                    <AudioTimeline
                        takes={takes}
                        activeTakeId={activeTakeId}
                        combinedUrl={combinedUrl}
                        processing={processing}
                        onSelect={onSelectTake}
                        onDelete={onDeleteTake}
                        onMergeAll={onMergeAll}
                        onPlayCombined={onPlayCombined}
                    />
                </Card>

                {activeTake && (
                    <SegmentEditor
                        take={activeTake}
                        processing={processing}
                        onProcessed={onProcessed}
                        setProcessing={setProcessing}
                        setStatus={setStatus}
                        setError={setError}
                    />
                )}

                {/* Upload tài nguyên */}
                {/* Upload tài nguyên */}
                <Card size="small" title="Tải tài nguyên" style={{ marginBottom: 12 }}>
                    <Space direction="vertical" style={{ width: "100%" }} size="middle">
                        {/* Audio */}
                        <div>
                            <Space.Compact style={{ width: "100%" }}>
                                <Upload
                                    accept="audio/*"
                                    showUploadList={false}
                                    beforeUpload={(file) => {
                                        onUploadAudio(file);
                                        return false;
                                    }}
                                    style={{ flex: 1 }}
                                >
                                    <Button
                                        icon={<SoundOutlined />}
                                        block
                                        type={audioUrl ? "primary" : "default"}
                                        ghost={!!audioUrl}
                                    >
                                        {audioUrl ? "✓ Đã chọn Audio" : "Tải Audio có sẵn"}
                                    </Button>
                                </Upload>

                                {audioUrl && (
                                    <Button
                                        danger
                                        icon={<span style={{ fontSize: 14 }}>✕</span>}
                                        onClick={() => onUploadAudio(undefined)}
                                        title="Xóa audio"
                                    />
                                )}
                            </Space.Compact>

                            {audioName && (
                                <div style={{ fontSize: 12, color: "#86efac", marginTop: 4 }}>
                                    {audioName}
                                </div>
                            )}
                        </div>

                        {/* Ảnh nền */}
                        <div>
                            <Space.Compact style={{ width: "100%" }}>
                                <Upload
                                    accept="image/*"
                                    showUploadList={false}
                                    beforeUpload={(file) => {
                                        onUploadImage(file);
                                        return false;
                                    }}
                                >
                                    <Button
                                        icon={<PictureOutlined />}
                                        block
                                        type={imageUrl ? "primary" : "default"}
                                        ghost={!!imageUrl}
                                    >
                                        {imageUrl ? "✓ Đã chọn Ảnh nền" : "Tải Ảnh nền"}
                                    </Button>
                                </Upload>

                                {imageUrl && (
                                    <Button
                                        danger
                                        icon={<span style={{ fontSize: 14 }}>✕</span>}
                                        onClick={() => onUploadImage(undefined)}
                                        title="Xóa ảnh nền"
                                    />
                                )}
                            </Space.Compact>

                            {imageName && (
                                <div style={{ fontSize: 12, color: "#86efac", marginTop: 4 }}>
                                    {imageName}
                                </div>
                            )}
                        </div>

                        {/* Video nền */}
                        <div>
                            <Space.Compact style={{ width: "100%" }}>
                                <Upload
                                    accept="video/*"
                                    showUploadList={false}
                                    beforeUpload={(file) => {
                                        onUploadVideo(file);
                                        return false;
                                    }}
                                >
                                    <Button
                                        icon={<VideoCameraOutlined />}
                                        block
                                        type={videoUrl ? "primary" : "default"}
                                        ghost={!!videoUrl}
                                    >
                                        {videoUrl ? "✓ Đã chọn Video nền" : "Tải Video nền"}
                                    </Button>
                                </Upload>

                                {videoUrl && (
                                    <Button
                                        danger
                                        icon={<span style={{ fontSize: 14 }}>✕</span>}
                                        onClick={() => onUploadVideo(undefined)}
                                        title="Xóa video nền"
                                    />
                                )}
                            </Space.Compact>

                            {videoName && (
                                <div style={{ fontSize: 12, color: "#86efac", marginTop: 4 }}>
                                    {videoName}
                                </div>
                            )}
                        </div>
                    </Space>
                </Card>
                {/* Nút Kết hợp + Xuất */}
                <Space direction="vertical" style={{ width: "100%" }}>
                    <Button
                        type="primary"
                        icon={<SyncOutlined />}
                        size="large"
                        block
                        loading={busy}
                        disabled={isRecording}
                        onClick={onCompile}
                        style={{ background: "#059669" }}
                    >
                        Kết hợp Âm thanh vào Video
                    </Button>

                    <Button
                        type="primary"
                        icon={<ExportOutlined />}
                        size="large"
                        block
                        loading={busy}
                        disabled={!composition || isRecording}
                        onClick={onExport}
                    >
                        {busy ? `Đang xuất ${progress}%` : "Xuất video MP4"}
                    </Button>
                </Space>

                {busy && (
                    <Progress
                        percent={progress}
                        style={{ marginTop: 12 }}
                        strokeColor="#8b5cf6"
                    />
                )}

                {status && (
                    <Alert
                        style={{ marginTop: 12 }}
                        type="info"
                        showIcon
                        message={status}
                    />
                )}

                {error && (
                    <Alert
                        style={{ marginTop: 12 }}
                        type="error"
                        showIcon
                        message={error}
                    />
                )}
            </div>
        </div>
    );
}