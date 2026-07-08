import { Audio } from "expo-av";
import { useCallback, useRef, useState } from "react";

export type VoiceRecorderResult = {
  recording: boolean;
  audioUri: string | null;
  error: string | null;
  hasRecording: boolean;
  toggle: () => Promise<void>;
  reset: () => void;
};

export function useVoiceRecorder(): VoiceRecorderResult {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<Audio.Recording | null>(null);

  const reset = useCallback(() => {
    void (async () => {
      if (recRef.current) {
        try {
          await recRef.current.stopAndUnloadAsync();
        } catch {}
        recRef.current = null;
      }
      setIsRecording(false);
      setAudioUri(null);
      setError(null);
    })();
  }, []);

  const start = useCallback(async () => {
    setError(null);
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        setError("Microphone access is required to record your enquiry.");
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await rec.startAsync();
      recRef.current = rec;
      setIsRecording(true);
    } catch {
      setError("Could not start recording. Please check microphone permissions.");
    }
  }, []);

  const stop = useCallback(async () => {
    const rec = recRef.current;
    if (!rec) return;
    try {
      await rec.stopAndUnloadAsync();
      const uri = rec.getURI();
      recRef.current = null;
      setIsRecording(false);
      setAudioUri(uri ?? null);
    } catch {
      setError("Recording stopped with an error. Please try again.");
      setIsRecording(false);
    }
  }, []);

  const toggle = useCallback(async () => {
    if (isRecording) await stop();
    else await start();
  }, [isRecording, start, stop]);

  return {
    recording: isRecording,
    audioUri,
    error,
    hasRecording: Boolean(audioUri),
    toggle,
    reset,
  };
}
