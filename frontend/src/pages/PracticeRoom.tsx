import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useSpeech } from '../hooks/useSpeech';
import ChatBubble from '../components/ChatBubble';
import FeedbackPanel from '../components/FeedbackPanel';
import MicButton from '../components/MicButton';

const roleMap: Record<string, string> = {
  面试: 'HR',
  餐厅: 'Waiter',
  会议: 'Manager',
  旅行: 'Guide',
};

export default function PracticeRoom() {
  const navigate = useNavigate();
  const {
    conversation,
    feedback,
    correction,
    pronunciation,
    vocabulary,
    scenarios,
    selectedScenarioId,
    selectedDifficulty,
    currentSessionId,
    sendMessageAction,
    endSessionAction,
  } = useStore();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [textInput, setTextInput] = useState('');
  const [sending, setSending] = useState(false);
  const [speechOn, setSpeechOn] = useState(true);
  const { speak, stop, toggle } = useSpeech();
  const lastAIText = useRef('');

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    // Speak new AI messages when content stabilizes (non-empty)
    const latest = conversation[conversation.length - 1];
    if (latest?.role === 'ai' && latest.message && latest.message !== lastAIText.current) {
      lastAIText.current = latest.message;
      speak(latest.message);
    }
  }, [conversation, speak]);

  const selected = scenarios.find((sc) => sc.id === selectedScenarioId);
  const role = selected ? (roleMap[selected.name] ?? '—') : '—';

  const handleEndSession = async () => {
    await endSessionAction();
    navigate(`/report?id=${currentSessionId}`);
  };

  const handleSend = async () => {
    if (!textInput.trim() || sending) return;
    const msg = textInput;
    setTextInput('');
    setSending(true);
    try {
      await sendMessageAction(msg);
    } catch {
      // ignore
    }
    setSending(false);
  };

  return (
    <div className="grid grid-cols-[18%_54%_28%] gap-5 h-[calc(100vh-7rem)]">
      {/* ────── Left Panel: Scene Info + Actions ────── */}
      <aside className="glass-card rounded-2xl p-6 flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-2xl bg-hero-gradient flex items-center justify-center mb-4 shadow-glow">
          <svg className="w-7 h-7 text-blue-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-text mb-0.5">{selected?.name ?? '—'}</h2>
        <p className="text-xs text-muted mb-4">
          <span className="font-semibold text-primary">{role}</span> · {selectedDifficulty}
        </p>
        <div className="w-full space-y-2 mt-auto">
          <button className="w-full px-4 py-2.5 rounded-xl text-sm font-medium bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors">
            暂停会话
          </button>
          <button className="w-full px-4 py-2.5 rounded-xl text-sm font-medium bg-gray-50 text-muted border border-gray-200 hover:bg-gray-100 transition-colors">
            重置会话
          </button>
        </div>
      </aside>

      {/* ────── Center Panel: Chat + Input ────── */}
      <main className="flex flex-col gap-4 min-h-0">
        {/* Top bar: End session */}
        <div className="glass-card rounded-xl px-5 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm font-medium text-text">练习进行中</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { const s = toggle(); setSpeechOn(s); }}
              title={speechOn ? '关闭语音播报' : '开启语音播报'}
              className={`p-2 rounded-lg transition-all ${
                speechOn
                  ? 'bg-primary-50 text-primary hover:bg-primary-100'
                  : 'bg-gray-100 text-muted hover:bg-gray-200'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                {!speechOn && (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L21 12m0 0l-3.75 2.25M21 12l-3.75-2.25M21 12H9" />
                )}
              </svg>
            </button>
            <button
              onClick={handleEndSession}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-blue-800 text-sm font-medium hover:from-red-600 hover:to-red-700 transition-all shadow-sm shadow-red-500/20"
            >
              结束会话
            </button>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="glass-card rounded-2xl p-5 flex-1 min-h-0 overflow-y-auto">
          {conversation.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted text-sm gap-2">
              <svg className="w-10 h-10 text-primary/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
              <p>开始对话，AI 将在这里回应你</p>
            </div>
          ) : (
            conversation.map((msg, i) => (
              <ChatBubble key={i} role={msg.role} message={msg.message} />
            ))
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <div className="glass-card rounded-2xl px-5 py-4 flex items-center gap-4 shrink-0">
          <MicButton onTranscription={(text) => { if (text.trim()) sendMessageAction(text); }} />
          <div className="flex-1 relative">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="输入你的回答..."
              disabled={sending}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-text placeholder:text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all disabled:bg-gray-50 bg-white/80"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!textInput.trim() || sending}
            className={`px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
              textInput.trim() && !sending
                ? 'bg-hero-gradient text-blue-800 shadow-md shadow-primary/30 hover:shadow-lg hover:scale-105 active:scale-95'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {sending ? (
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            )}
          </button>
        </div>
      </main>

      {/* ────── Right Panel: Real-time Feedback ────── */}
      <aside className="min-h-0 overflow-y-auto">
        <FeedbackPanel data={feedback} correction={correction} pronunciation={pronunciation} vocabulary={vocabulary} />
      </aside>
    </div>
  );
}
