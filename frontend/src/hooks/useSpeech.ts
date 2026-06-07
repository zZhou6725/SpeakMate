import { useCallback, useRef } from 'react';

export function useSpeech() {
  const enabledRef = useRef(true);
  const speakingRef = useRef(false);

  const speak = useCallback((text: string) => {
    if (!enabledRef.current || !text.trim()) return;
    if (!('speechSynthesis' in window)) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    utterance.pitch = 1.0;

    // Try to find a good English voice
    const voices = window.speechSynthesis.getVoices();
    const enVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google'))
      || voices.find(v => v.lang.startsWith('en-US'))
      || voices.find(v => v.lang.startsWith('en'));
    if (enVoice) utterance.voice = enVoice;

    speakingRef.current = true;
    utterance.onend = () => { speakingRef.current = false; };
    utterance.onerror = () => { speakingRef.current = false; };

    window.speechSynthesis.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    speakingRef.current = false;
  }, []);

  const toggle = useCallback(() => {
    enabledRef.current = !enabledRef.current;
    if (!enabledRef.current) stop();
    return enabledRef.current;
  }, [stop]);

  return { speak, stop, toggle, enabledRef, speakingRef };
}