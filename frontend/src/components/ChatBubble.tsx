import type { ChatMessage } from '../types';

export default function ChatBubble({ role, message }: ChatMessage) {
  const isAI = role === 'ai';
  return (
    <div className={`flex ${isAI ? 'justify-start' : 'justify-end'} mb-4`}>
      <div
        className={`max-w-[75%] px-4 py-3 rounded-card text-sm leading-relaxed ${
          isAI
            ? 'bg-gray-100 text-text rounded-tl-none'
            : 'bg-primary text-white rounded-tr-none'
        }`}
      >
        <p className="text-xs font-semibold mb-1 opacity-70">
          {isAI ? 'AI' : '你'}
        </p>
        <p>{message}</p>
      </div>
    </div>
  );
}