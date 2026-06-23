import { useCallback, useRef, useState } from "react";

export type WebVoiceRecorderResult = {
  recording: boolean;
  audioBlob: Blob | null;
  error: string | null;
  hasRecording: boolean;
  toggle: () => Promise<void>;
  reset: () => void;
};

export function useWebVoiceRecorder(): WebVoiceRecorderResult {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const reset = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      try {
        recorderRef.current.stop();
      } catch {
        /* ignore */
      }
    }
    recorderRef.current = null;
    chunksRef.current = [];
    setRecording(false);
    setAudioBlob(null);
    setError(null);
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setAudioBlob(null);
    chunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const recorder = new MediaRecorder(stream, { mimeType });
      recorderRef.current = recorder;
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob.size > 0 ? blob : null);
        setRecording(false);
        recorderRef.current = null;
      };
      recorder.onerror = () => {
        setError("Recording stopped with an error. Please try again.");
        setRecording(false);
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      setRecording(true);
    } catch {
      setError("Microphone access is required to record your enquiry.");
    }
  }, []);

  const stop = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    recorder.stop();
  }, []);

  const toggle = useCallback(async () => {
    if (recording) stop();
    else await start();
  }, [recording, start, stop]);

  return {
    recording,
    audioBlob,
    error,
    hasRecording: Boolean(audioBlob),
    toggle,
    reset,
  };
}
