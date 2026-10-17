export const ENTRY_CODE = `
import { registerRoot } from "remotion";
import { Root } from "./Root";
registerRoot(Root);
`;

export const INTRO_TEMPLATE = `
import {
  AbsoluteFill,
  Composition,
  useCurrentFrame,
  interpolate,
  Easing,
} from "remotion";
import { Video, Audio } from "@remotion/media";

type Props = {
  title: string;
  narration: string;
  imageUrl: string | null;
  videoUrl: string | null;
  audioUrl: string | null;
  audioStartFrom?: number;
};

const MainVideo = ({
  title,
  narration,
  imageUrl,
  videoUrl,
  audioUrl,
  audioStartFrom = 0,
}: Props) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  const y = interpolate(frame, [0, 20], [50, 0], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const scale = interpolate(frame, [0, 150], [1, 1.06], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #09090b, #27272a, #881337)",
        color: "white",
        fontFamily: "Arial, sans-serif",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      {imageUrl && (
        <img
          src={imageUrl}
          alt=""
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.45,
            transform: \`scale(\${scale})\`,
          }}
        />
      )}

      {videoUrl && (
        <Video
          src={videoUrl}
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.5,
          }}
        />
      )}

      <AbsoluteFill
        style={{
          background: "linear-gradient(180deg, #00000033, #00000099)",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 2,
          padding: 60,
          textAlign: "center",
          opacity,
          transform: \`translateY(\${y}px)\`,
          fontSize: 76,
          fontWeight: 800,
          lineHeight: 1.25,
          overflowWrap: "anywhere",
          textShadow: "0 5px 30px #000",
        }}
      >
        {title}
      </div>

      {narration && (
        <div
          style={{
            position: "absolute",
            zIndex: 3,
            bottom: 180,
            left: 60,
            right: 60,
            padding: 24,
            borderRadius: 16,
            backgroundColor: "#00000088",
            textAlign: "center",
            fontSize: 32,
            lineHeight: 1.5,
            opacity,
          }}
        >
          {narration}
        </div>
      )}

      {audioUrl && (
        <Audio src={audioUrl} startFrom={Math.round(audioStartFrom * 30)} />
      )}
    </AbsoluteFill>
  );
};

export const Root = () => (
  <Composition
    id="MyVideo"
    component={MainVideo}
    durationInFrames={150}
    fps={30}
    width={1080}
    height={1920}
    defaultProps={{
      title: "Xin chào!",
      narration: "Tôi luôn nỗ lực học tập và phát triển bản thân mỗi ngày.",
      imageUrl: null,
      videoUrl: null,
      audioUrl: null,
      audioStartFrom: 0,
    }}
  />
);
`;

export function makeTemplate(kind: string) {
  if (kind === "quote") {
    return INTRO_TEMPLATE
      .replace("Xin chào!", "Đừng ngừng cố gắng!")
      .replaceAll("#881337", "#1d4ed8");
  }
  return INTRO_TEMPLATE;
}