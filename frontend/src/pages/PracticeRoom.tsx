import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import ChatBubble from '../components/ChatBubble';
import FeedbackPanel from '../components/FeedbackPanel';
import MicButton from '../components/MicButton';

export default function PracticeRoom() {
  const navigate = useNavigate();
  const { conversation, feedback, isSessionActive } = useStore();
  const [textInput, setTextInput] = useState('');

  const handleEndSession = () => {
    navigate('/report');
  };

  const handleSend = () => {
    if (!textInput.trim()) return;
    setTextInput('');
  };

  const selected = useStore((s) => s.scenarios.find((sc) => sc.id === s.selectedScenarioId));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Chat Area */}
      <div className="lg:col-span-2">
        {/* Header */}
        <div className="bg-white rounded-card p-4 shadow-sm border border-gray-100 mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-text">
              {selected?.name ?? '练习'} 场景
            </h2>
            <p className="text-xs text-muted">
              {isSessionActive ? '练习进行中...' : '请在首页选择场景后开始练习'}
            </p>
          </div>
          <button
            onClick={handleEndSession}
            className="px-5 py-2 rounded-card bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors shadow-sm"
          >
            结束对话
          </button>
        </div>

        {/* Chat Messages */}
        <div className="bg-white rounded-card p-4 shadow-sm border border-gray-100 min-h-[420px] max-h-[520px] overflow-y-auto mb-4">
          {conversation.length === 0 ? (
            <div className="flex items-center justify-center h-60 text-muted text-sm">
              选择一个场景开始练习，对话将在这里显示。
            </div>
          ) : (
            conversation.map((msg, i) => (
              <ChatBubble key={i} role={msg.role} message={msg.message} />
            ))
          )}
        </div>

        {/* Input Area */}
        <div className="flex flex-col items-center gap-4 bg-white rounded-card p-6 shadow-sm border border-gray-100">
          <MicButton />
          <div className="w-full flex gap-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="在这里输入你的回答..."
              className="flex-1 px-4 py-2.5 rounded-card border border-gray-200 text-sm text-text placeholder:text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
            <button
              onClick={handleSend}
              className="px-5 py-2.5 rounded-card bg-primary text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
            >
              发送
            </button>
          </div>
        </div>
      </div>

      {/* Feedback Sidebar */}
      <div className="lg:col-span-1">
        <FeedbackPanel data={feedback} />
      </div>
    </div>
  );
}