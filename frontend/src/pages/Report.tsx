import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ScoreRing from '../components/ScoreRing';
import RadarChart from '../components/RadarChart';
import FeedbackPanel from '../components/FeedbackPanel';
import ChatBubble from '../components/ChatBubble';
import { fetchReport } from '../api/reports';
import type { PracticeSession } from '../types';

export default function Report() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = parseInt(searchParams.get('id') ?? '0', 10);

  const [session, setSession] = useState<PracticeSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    setLoading(true);
    setError(null);
    fetchReport(sessionId)
      .then((data) => {
        setSession(data);
        setLoading(false);
      })
      .catch((e) => {
        setError(String(e));
        setLoading(false);
      });
  }, [sessionId]);

  const handleExport = () => {
    // Placeholder: future export functionality
    window.open(`/api/reports/${sessionId}/export`, '_blank');
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <p className="text-muted text-lg">加载报告数据...</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="text-center py-20">
        <p className="text-muted text-lg">{error || '报告未找到。'}</p>
        <button
          onClick={() => navigate('/history')}
          className="mt-4 px-6 py-2 rounded-card bg-primary text-white font-medium hover:bg-blue-700 transition-colors"
        >
          返回历史记录
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text">练习报告</h1>
          <p className="text-muted mt-1">
            {session.scenarioName} &middot; {session.duration} &middot; {session.score} 分
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/history')}
            className="px-5 py-2 rounded-card text-sm font-medium text-muted border border-gray-200 hover:border-gray-300 bg-white transition-colors"
          >
            返回历史记录
          </button>
          <button
            onClick={handleExport}
            className="px-5 py-2 rounded-card text-sm font-medium text-white bg-primary hover:bg-blue-700 transition-colors shadow-sm"
          >
            导出报告
          </button>
        </div>
      </div>

      {/* Top Stats & Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Score Summary */}
        <div className="bg-white rounded-card p-6 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-text mb-6">得分概览</h3>
          <div className="flex items-center justify-around">
            <ScoreRing value={session.radarData.pronunciation} label="发音" />
            <ScoreRing value={session.radarData.grammar} label="语法" />
            <ScoreRing value={session.feedback.fluency} label="流利度" />
          </div>
        </div>

        {/* Radar Chart */}
        <div className="bg-white rounded-card p-6 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-text mb-4">能力雷达图</h3>
          <RadarChart data={session.radarData} />
        </div>
      </div>

      {/* Feedback + Conversation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversation */}
        <div className="lg:col-span-2 bg-white rounded-card p-4 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-text mb-4">对话记录</h3>
          <div className="max-h-80 overflow-y-auto">
            {session.conversation.length === 0 ? (
              <p className="text-muted text-sm py-8 text-center">暂无对话记录。</p>
            ) : (
              session.conversation.map((msg, i) => (
                <ChatBubble key={i} role={msg.role} message={msg.message} />
              ))
            )}
          </div>
        </div>

        {/* Feedback Sidebar */}
        <div>
          <FeedbackPanel data={session.feedback} />
        </div>
      </div>
    </div>
  );
}
