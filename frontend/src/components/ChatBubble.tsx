import { cleanForSpeech } from '../utils/cleanText';
import type { ChatMessage } from '../types';

interface Props {
  role: ChatMessage['role'];
  message: ChatMessage['message'];
  onReplay?: () => void;
}

export default function ChatBubble({ role, message, onReplay }: Props) {
  const isAI = role === 'ai';

  const handleReplay = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const cleaned = cleanForSpeech(message);
      const utterance = new SpeechSynthesisUtterance(cleaned);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      const voices = window.speechSynthesis.getVoices();
      const enVoice =
        voices.find(v => v.lang === 'en-US' && v.name.includes('Google')) ||
        voices.find(v => v.lang === 'en-US') ||
        voices.find(v => v.lang.startsWith('en'));
      if (enVoice) utterance.voice = enVoice;
      window.speechSynthesis.speak(utterance);
    }
    onReplay?.();
  };

  return (
    <div className={`flex ${isAI ? 'justify-start' : 'justify-end'} mb-4`}>
      <div className={`group relative max-w-[75%] ${isAI ? 'flex items-start gap-2' : ''}`}>
        {isAI && (
          <button
            onClick={handleReplay}
            className="mt-1 p-1.5 rounded-lg text-muted/50 hover:text-primary hover:bg-primary-50 opacity-0 group-hover:opacity-100 transition-all shrink-0"
            title="点击重播"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
            </svg>
          </button>
        )}
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
            isAI
              ? 'glass-card rounded-tl-md'
              : 'bg-hero-gradient text-white rounded-tr-md shadow-md shadow-primary/20'
          }`}
        >
          <p className={`text-xs font-semibold mb-1 ${isAI ? 'text-primary/60' : 'text-blue-100'}`}>
            {isAI ? 'AI' : '你'}
          </p>
          <p>{message}</p>
        </div>
      </div>
    </div>
  );
}