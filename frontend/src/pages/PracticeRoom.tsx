import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import ChatBubble from '../components/ChatBubble';
import FeedbackPanel from '../components/FeedbackPanel';

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
    scenarios,
    selectedScenarioId,
    currentSessionId,
    sendMessageAction,
    endSessionAction,
  } = useStore();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [textInput, setTextInput] = useState('');
  const [sending, setSending] = useState(false);
  const [micActive, setMicActive] = useState(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

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
      // ignore — feedback still updates via store
    }
    setSending(false);
  };

  return (
    <div className="grid grid-cols-[20%_55%_25%] gap-4 h-[calc(100vh-6rem)]">
      {/* ────── Left Panel: Scene Info + Actions ────── */}
      <aside className="bg-white rounded-card p-5 shadow-sm border border-gray-100 flex flex-col items-center text-center">
        <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">场景</p>
        <h2 className="text-xl font-bold text-text mb-1">{selected?.name ?? '—'}</h2>
        <p className="text-sm text-muted mb-8">
          扮演角色：<span className="font-semibold text-primary">{role}</span>
        </p>

        <div className="w-full space-y-2.5 mt-auto">
          <button className="w-full px-4 py-2.5 rounded-card text-sm font-medium bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100 transition-colors">
            暂停会话
          </button>
          <button className="w-full px-4 py-2.5 rounded-card text-sm font-medium bg-gray-50 text-muted border border-gray-200 hover:bg-gray-100 transition-colors">
            重置会话
          </button>
        </div>
      </aside>

      {/* ────── Center Panel: Chat + Mic + Input ────── */}
      <main className="flex flex-col gap-4 min-h-0">
        {/* Top bar: End session */}
        <div className="bg-white rounded-card px-4 py-2.5 shadow-sm border border-gray-100 flex items-center justify-between shrink-0">
          <span className="text-xs text-muted">练习进行中...</span>
          <button
            onClick={handleEndSession}
            className="px-5 py-2 rounded-card bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors shadow-sm"
          >
            结束会话
          </button>
        </div>

        {/* Chat Messages — top half */}
        <div className="bg-white rounded-card p-4 shadow-sm border border-gray-100 flex-1 min-h-0 overflow-y-auto">
          {conversation.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted text-sm">
              选择一个场景开始练习，对话将在这里显示。
            </div>
          ) : (
            conversation.map((msg, i) => (
              <ChatBubble key={i} role={msg.role} message={msg.message} />
            ))
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Mic + Text Input — bottom bar */}
        <div className="bg-white rounded-card px-5 py-4 shadow-sm border border-gray-100 flex flex-col items-center gap-3 shrink-0">
          {/* Mic button with ripple */}
          <div className="relative flex items-center justify-center" style={{ width: 80, height: 80 }}>
            {micActive && (
              <>
                <span className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
                <span className="absolute inset-2 rounded-full bg-primary/15 animate-pulse" />
              </>
            )}
            <button
              onClick={() => setMicActive((r) => !r)}
              className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-md ${
                micActive
                  ? 'bg-red-500 scale-110 shadow-red-200'
                  : 'bg-primary hover:bg-blue-700 hover:scale-105 shadow-blue-200'
              }`}
            >
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {micActive ? (
                  <rect x="6" y="6" width="12" height="12" rx="1" fill="currentColor" />
                ) : (
                  <path d="M12 2a3 3 0 00-3 3v6a3 3 0 006 0V5a3 3 0 00-3-3z" />
                )}
              </svg>
            </button>
          </div>
          <span className="text-xs font-medium text-muted select-none">
            {micActive ? '点击结束' : '点击说话'}
          </span>
          <div className="w-full">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="在这里输入你的回答..."
              disabled={sending}
              className="w-full px-4 py-3 rounded-card border border-gray-200 text-sm text-text placeholder:text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors disabled:bg-gray-50"
            />
          </div>
        </div>
      </main>

      {/* ────── Right Panel: Real-time Feedback ────── */}
      <aside className="min-h-0 overflow-y-auto">
        <FeedbackPanel data={feedback} correction={correction} />
      </aside>
    </div>
  );
}
