import type { ChatMessage } from '../types';

export default function ChatBubble({ role, message }: ChatMessage) {
  const isAI = role === 'ai';
  return (
    <div className={`flex ${isAI ? 'justify-start' : 'justify-end'} mb-4`}>
      <div
        className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isAI
            ? 'glass-card rounded-tl-md'
            : 'bg-hero-gradient text-blue-800 rounded-tr-md shadow-md shadow-primary/20'
        }`}
      >
        <p className={`text-xs font-semibold mb-1 ${isAI ? 'text-primary/60' : 'text-blue-200'}`}>
          {isAI ? 'AI' : '你'}
        </p>
        <p className={isAI ? '' : ''}>{message}</p>
      </div>
    </div>
  );
}