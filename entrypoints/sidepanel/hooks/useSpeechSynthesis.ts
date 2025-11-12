import { useState, useEffect, useRef, useCallback } from "react";

export interface SpeechSynthesisHook {
  isSpeaking: boolean;
  isPaused: boolean;
  speak: (text: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  isSupported: boolean;
}

/**
 * Custom hook for text-to-speech functionality using Web Speech API
 */
export function useSpeechSynthesis(): SpeechSynthesisHook {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    // Check if Web Speech API is supported
    setIsSupported("speechSynthesis" in window);

    // Cleanup on unmount
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!isSupported || !text.trim()) {
        return;
      }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      // Remove markdown formatting for better speech
      const cleanText = text
        .replace(/#{1,6}\s/g, "") // Remove markdown headers
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Remove markdown links, keep text
        .replace(/\*\*([^*]+)\*\*/g, "$1") // Remove bold
        .replace(/\*([^*]+)\*/g, "$1") // Remove italic
        .replace(/`([^`]+)`/g, "$1") // Remove inline code
        .replace(/```[\s\S]*?```/g, "") // Remove code blocks
        .replace(/^\s*[-*+]\s/gm, "") // Remove list markers
        .replace(/^\s*\d+\.\s/gm, "") // Remove numbered list markers
        .trim();

      if (!cleanText) {
        return;
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utteranceRef.current = utterance;

      // Try to find a Japanese voice
      const voices = window.speechSynthesis.getVoices();
      const japaneseVoice = voices.find(
        (voice) => voice.lang.startsWith("ja") || voice.lang.startsWith("jp")
      );

      if (japaneseVoice) {
        utterance.voice = japaneseVoice;
        utterance.lang = japaneseVoice.lang;
      } else {
        utterance.lang = "ja-JP";
      }

      utterance.rate = 1.0; // Normal speed
      utterance.pitch = 1.0; // Normal pitch
      utterance.volume = 1.0; // Max volume

      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
        utteranceRef.current = null;
      };

      utterance.onerror = (event) => {
        console.error("Speech synthesis error:", event);
        setIsSpeaking(false);
        setIsPaused(false);
        utteranceRef.current = null;
      };

      utterance.onpause = () => {
        setIsPaused(true);
      };

      utterance.onresume = () => {
        setIsPaused(false);
      };

      window.speechSynthesis.speak(utterance);
    },
    [isSupported]
  );

  const pause = useCallback(() => {
    if (isSupported && isSpeaking && !isPaused) {
      window.speechSynthesis.pause();
    }
  }, [isSupported, isSpeaking, isPaused]);

  const resume = useCallback(() => {
    if (isSupported && isSpeaking && isPaused) {
      window.speechSynthesis.resume();
    }
  }, [isSupported, isSpeaking, isPaused]);

  const stop = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
      utteranceRef.current = null;
    }
  }, [isSupported]);

  return {
    isSpeaking,
    isPaused,
    speak,
    pause,
    resume,
    stop,
    isSupported,
  };
}
