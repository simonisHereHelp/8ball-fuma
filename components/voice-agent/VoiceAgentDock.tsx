"use client";

import { useEffect, useMemo, useState } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { buildVoicePrompt, voiceAgentConfig } from "@/lib/voice-agent";

const supportsSpeechSynthesis = () =>
  typeof window !== "undefined" && "speechSynthesis" in window;

type VoiceAgentDockProps = {
  pageTitle: string;
  pagePath: string;
  pageSlug: string;
};

export function VoiceAgentDock({
  pageTitle,
  pagePath,
  pageSlug,
}: VoiceAgentDockProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const prompt = useMemo(
    () => buildVoicePrompt({ pageTitle, pagePath, pageSlug }),
    [pageTitle, pagePath, pageSlug],
  );

  useEffect(() => {
    return () => {
      if (supportsSpeechSynthesis()) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const stopSpeaking = () => {
    if (!supportsSpeechSynthesis()) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const handleSpeak = () => {
    if (!supportsSpeechSynthesis()) {
      setError("Speech synthesis is not supported in this browser.");
      return;
    }

    setError(null);
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(prompt);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => {
      setError("Unable to play audio for the voice agent.");
      setIsSpeaking(false);
    };
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const toggleSpeaking = () => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      handleSpeak();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      <div className="rounded-2xl border border-fd-border bg-fd-background/95 px-4 py-3 text-xs text-fd-muted-foreground shadow-lg backdrop-blur">
        <p className="font-medium text-fd-foreground">
          Voice agent: {voiceAgentConfig.nickname}
        </p>
        <p>Tap to hear the page title, path, and slug.</p>
        {error ? <p className="text-red-500">{error}</p> : null}
      </div>
      <button
        type="button"
        onClick={toggleSpeaking}
        aria-pressed={isSpeaking}
        aria-label={
          isSpeaking
            ? `Stop ${voiceAgentConfig.nickname} audio`
            : `Play ${voiceAgentConfig.nickname} audio`
        }
        className="inline-flex items-center gap-2 rounded-full border border-fd-border bg-fd-primary px-4 py-3 text-sm font-semibold text-fd-primary-foreground shadow-lg transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fd-primary"
      >
        {isSpeaking ? (
          <MicOff className="size-4" />
        ) : (
          <Mic className="size-4" />
        )}
        {isSpeaking ? "Stop voice" : "Play voice"}
        <span className="sr-only">{voiceAgentConfig.nickname}</span>
        {isSpeaking ? null : (
          <span className="sr-only">Press to hear the page context.</span>
        )}
      </button>
      {isSpeaking ? (
        <div className="flex items-center gap-2 text-xs text-fd-muted-foreground">
          <Loader2 className="size-3 animate-spin" /> Speaking
        </div>
      ) : null}
    </div>
  );
}
