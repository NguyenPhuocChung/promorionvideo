import { useEffect, useRef, useState } from "react";
import {
  createBrowserBundler,
  type VirtualProject,
} from "@remotion/browser-bundler";
import {
  getBrowserComposition,
  loadBrowserBundle,
  type BrowserComposition,
} from "@remotion/browser-bundler/runtime";
import { renderMediaOnWeb } from "@remotion/web-renderer";
import { message } from "antd";

import StudioHeader from "./components/StudioHeader";
import Toolbar from "./components/Toolbar";
import CodePanel from "./components/CodePanel";
import PreviewAndAudio from "./components/PreviewAndAudio";
import type { Take } from "./components/audio/TakesList";

import { ENTRY_CODE, INTRO_TEMPLATE, makeTemplate } from "./templates/videoTemplates";
import {
  decodeAudioData,
  audioBufferToWav,
  mergeAudioBuffers,
} from "./utils/audioUtils";

import "./App.css";

export default function App() {
  // ===== Video state =====
  const [code, setCode] = useState(INTRO_TEMPLATE);
  const [template, setTemplate] = useState("intro");
  const [title, setTitle] = useState("Xin chào!");
  const [narration] = useState(
    "Xin chào! Tôi là Nguyễn Phước Chung. Tôi đang nỗ lực học tập và phát triển bản thân mỗi ngày."
  );
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Tên file đã chọn
  const [audioName, setAudioName] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const [videoName, setVideoName] = useState<string | null>(null);

  // ===== Composition =====
  const [composition, setComposition] = useState<BrowserComposition | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);

  // ===== Recording =====
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // ===== Audio Timeline =====
  const [takes, setTakes] = useState<Take[]>([]);
  const [activeTakeId, setActiveTakeId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [combinedUrl, setCombinedUrl] = useState<string | null>(null);

  // ===== Undo / Redo =====
  const [undoStack, setUndoStack] = useState<Take[][]>([]);
  const [redoStack, setRedoStack] = useState<Take[][]>([]);

  const objectUrls = useRef<Set<string>>(new Set());
  const combinedAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      objectUrls.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrls.current.clear();
    };
  }, []);

  // ===== Keyboard shortcuts =====
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      const isCtrl = e.ctrlKey || e.metaKey;

      if (isCtrl && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }

      if (
        isCtrl &&
        (e.key.toLowerCase() === "y" ||
          (e.key.toLowerCase() === "z" && e.shiftKey))
      ) {
        e.preventDefault();
        handleRedo();
        return;
      }

      if ((e.key === "Delete" || e.key === "Backspace") && activeTakeId) {
        e.preventDefault();
        handleDeleteTake(activeTakeId);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [takes, undoStack, redoStack, activeTakeId]);

  // ===== Helpers =====
  function addObjectUrl(url: string) {
    objectUrls.current.add(url);
  }

  function revokeIfNeeded(url: string | null) {
    if (url) {
      URL.revokeObjectURL(url);
      objectUrls.current.delete(url);
    }
  }

  function saveToHistory(currentTakes: Take[]) {
    setUndoStack((prev) => [...prev.slice(-19), currentTakes]);
    setRedoStack([]);
  }

  function handleUndo() {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, takes]);
    setTakes(previous);
    setActiveTakeId(previous[0]?.id ?? null);
    message.info("Đã hoàn tác (Ctrl+Z)");
  }

  function handleRedo() {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    setUndoStack((prev) => [...prev, takes]);
    setTakes(next);
    setActiveTakeId(next[0]?.id ?? null);
    message.info("Đã làm lại");
  }

  function handleUpload(
    file: File | undefined,
    currentUrl: string | null,
    setter: (url: string | null) => void,
    setName: (name: string | null) => void
  ) {
    // Nếu không có file → nghĩa là đang xóa
    if (!file) {
      revokeIfNeeded(currentUrl);
      setter(null);
      setName(null);
      setComposition(null);
      setStatus("Đã xóa tài nguyên");
      message.info("Đã xóa");
      return;
    }

    // Trường hợp tải file mới
    revokeIfNeeded(currentUrl);
    const newUrl = URL.createObjectURL(file);
    addObjectUrl(newUrl);
    setter(newUrl);
    setName(file.name);
    setComposition(null);
    setStatus("Đã tải tài nguyên");
    message.success(`Đã tải: ${file.name}`);
  }
  // ===== Recording =====
  async function startRecording() {
    setError("");
    if (!composition) {
      message.warning("Hãy biên dịch video trước khi thu âm");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        addObjectUrl(url);

        const id = crypto.randomUUID();
        const newTake: Take = {
          id,
          url,
          blob,
          name: `Đoạn ${takes.length + 1}`,
        };

        setTakes((prev) => {
          saveToHistory(prev);
          return [...prev, newTake];
        });
        setActiveTakeId(id);
        setStatus("Đã thêm đoạn thu mới");
        message.success("Đã lưu đoạn thu");
        stream.getTracks().forEach((t) => t.stop());
      };

      const playerRef = (window as any).__playerRef;
      playerRef?.current?.seekTo(0);
      playerRef?.current?.play();

      mediaRecorder.start();
      setIsRecording(true);
      setStatus("🔴 Đang thu âm...");
    } catch {
      setError("Không thể bật micro");
      message.error("Không thể bật micro");
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      const playerRef = (window as any).__playerRef;
      playerRef?.current?.pause();
      setIsRecording(false);
    }
  }

  // ===== Timeline actions =====
  function handleProcessed(blob: Blob, name: string) {
    const url = URL.createObjectURL(blob);
    addObjectUrl(url);
    const id = crypto.randomUUID();
    const newTake: Take = { id, url, blob, name };

    setTakes((prev) => {
      saveToHistory(prev);
      return [...prev, newTake];
    });
    setActiveTakeId(id);
  }

  function handleDeleteTake(id: string) {
    setTakes((prev) => {
      saveToHistory(prev);
      const next = prev.filter((t) => t.id !== id);
      if (activeTakeId === id) setActiveTakeId(next[0]?.id ?? null);
      return next;
    });
  }

  async function handleMergeAll() {
    if (takes.length < 2) {
      message.warning("Cần ít nhất 2 đoạn để ghép");
      return;
    }
    setProcessing(true);
    try {
      const buffers = await Promise.all(
        takes.map((t) => decodeAudioData(t.blob))
      );
      const merged = await mergeAudioBuffers(buffers);
      const wav = audioBufferToWav(merged);
      const url = URL.createObjectURL(wav);
      addObjectUrl(url);

      revokeIfNeeded(audioUrl);
      setAudioUrl(url);
      setCombinedUrl(url);
      setAudioName("audio-merged.wav");

      setStatus("Đã ghép tất cả đoạn");
      message.success("Ghép thành công");
    } catch (e) {
      setError(String(e));
    } finally {
      setProcessing(false);
    }
  }

  function handlePlayCombined() {
    if (!combinedUrl) return;
    if (combinedAudioRef.current) {
      combinedAudioRef.current.pause();
    }
    const audio = new Audio(combinedUrl);
    combinedAudioRef.current = audio;
    audio.play();
  }

  // ===== Compile & Export =====
  async function compileCode() {
    setBusy(true);
    setError("");
    setStatus("Đang kết hợp dữ liệu...");

    let bundler: ReturnType<typeof createBrowserBundler> | undefined;

    try {
      const project: VirtualProject = {
        entryPoint: "src/index.ts",
        files: {
          "src/index.ts": ENTRY_CODE,
          "src/Root.tsx": code,
        },
      };

      bundler = createBrowserBundler();
      const bundle = await bundler.bundle({ project });
      const root = loadBrowserBundle({ bundle });

      const result = await getBrowserComposition({
        root,
        compositionId: "MyVideo",
        inputProps: {
          title,
          narration,
          imageUrl,
          videoUrl,
          audioUrl,
          audioStartFrom: 0,
        },
      });

      setComposition(result);
      setStatus("Đã kết hợp xong!");
      message.success("Biên dịch thành công");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus("Biên dịch thất bại");
      message.error("Biên dịch thất bại");
    } finally {
      bundler?.dispose();
      setBusy(false);
    }
  }

  async function exportVideo() {
    if (!composition) {
      message.warning("Hãy biên dịch trước khi xuất");
      return;
    }

    setBusy(true);
    setError("");
    setProgress(0);
    setStatus("Đang xuất video...");

    try {
      const result = await renderMediaOnWeb({
        composition: {
          id: composition.id,
          component: composition.component,
          durationInFrames: composition.durationInFrames,
          fps: composition.fps,
          width: composition.width,
          height: composition.height,
        },
        inputProps: composition.props,
        container: "mp4",
        videoCodec: "h264",
        onProgress: ({ progress }) => setProgress(Math.round(progress * 100)),
      });

      const blob = await result.getBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "video-remotion.mp4";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);

      setProgress(100);
      setStatus("Xuất MP4 thành công!");
      message.success("Xuất video thành công");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus("Xuất thất bại");
      message.error("Xuất thất bại");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="studio">
      <StudioHeader />

      <Toolbar
        template={template}
        title={title}
        onTemplateChange={(value) => {
          setTemplate(value);
          setCode(makeTemplate(value));
          setComposition(null);
        }}
        onTitleChange={(value) => {
          setTitle(value);
          setComposition(null);
        }}
      />

      <CodePanel
        code={code}
        busy={busy}
        isRecording={isRecording}
        onCodeChange={(value) => {
          setCode(value);
          setComposition(null);
        }}
        onCompile={compileCode}
      />

      <PreviewAndAudio
        composition={composition}
        busy={busy}
        isRecording={isRecording}
        progress={progress}
        status={status}
        error={error}
        takes={takes}
        activeTakeId={activeTakeId}
        processing={processing}
        combinedUrl={combinedUrl}
        audioUrl={audioUrl}
        imageUrl={imageUrl}
        videoUrl={videoUrl}
        audioName={audioName}
        imageName={imageName}
        videoName={videoName}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
        onSelectTake={setActiveTakeId}
        onDeleteTake={handleDeleteTake}
        onMergeAll={handleMergeAll}
        onProcessed={handleProcessed}
        onPlayCombined={handlePlayCombined}
        setProcessing={setProcessing}
        setStatus={setStatus}
        setError={setError}
        onCompile={compileCode}
        onExport={exportVideo}
        onUploadAudio={(file) =>
          handleUpload(file, audioUrl, setAudioUrl, setAudioName)
        }
        onUploadImage={(file) =>
          handleUpload(file, imageUrl, setImageUrl, setImageName)
        }
        onUploadVideo={(file) =>
          handleUpload(file, videoUrl, setVideoUrl, setVideoName)
        }
      />
    </div>
  );
}