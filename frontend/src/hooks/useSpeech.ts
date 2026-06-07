import { useCallback, useEffect, useRef } from 'react';
import { cleanForSpeech } from '../utils/cleanText';

export function useSpeech() {
  const enabledRef = useRef(true);
  const voicesLoaded = useRef(false);
  const warmupDone = useRef(false);

  // Preload voices on mount
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) voicesLoaded.current = true;
    };
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
  }, []);

  const speak = useCallback((text: string) => {
    if (!enabledRef.current || !text.trim()) return;
    if (!('speechSynthesis' in window)) return;

    const synth = window.speechSynthesis;

    // Warm up: browsers require a user-gesture-initiated speak first.
    // If this is the first call, just fire and forget a short utterance
    // to unlock the audio context, then speak the real text.
    if (!warmupDone.current) {
      warmupDone.current = true;
      const warmup = new SpeechSynthesisUtterance('');
      warmup.volume = 0;
      warmup.rate = 2;
      synth.speak(warmup);
    }

    // Chrome sometimes pauses synthesis; resume it
    if (synth.paused) synth.resume();

    synth.cancel();

    const cleaned = cleanForSpeech(text);
    const utterance = new SpeechSynthesisUtterance(cleaned);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1;

    const voices = synth.getVoices();
    const enVoice =
      voices.find(v => v.lang === 'en-US' && v.name.includes('Google')) ||
      voices.find(v => v.lang === 'en-US' && v.name.includes('Samantha')) ||
      voices.find(v => v.lang === 'en-US') ||
      voices.find(v => v.lang.startsWith('en'));
    if (enVoice) utterance.voice = enVoice;

    // Split long text into sentences for more reliable playback
    synth.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const toggle = useCallback(() => {
    enabledRef.current = !enabledRef.current;
    if (!enabledRef.current) stop();
    return enabledRef.current;
  }, [stop]);

  return { speak, stop, toggle, enabledRef };
}