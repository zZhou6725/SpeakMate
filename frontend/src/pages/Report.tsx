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

  const handlePreview = () => {
    window.open(`/api/reports/${sessionId}/preview`, '_blank');
  };

  const handleExport = () => {
    const a = document.createElement('a');
    a.href = `/api/reports/${sessionId}/export`;
    a.download = `speakmate-report-${sessionId}.pdf`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto mb-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-muted text-base">加载报告数据...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="text-center py-32">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-50 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <p className="text-muted text-lg">{error || '报告未找到。'}</p>
        <button
          onClick={() => navigate('/history')}
          className="mt-6 px-6 py-2.5 rounded-xl bg-hero-gradient text-white font-medium hover:shadow-lg transition-all"
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
          <p className="text-sm font-semibold text-primary tracking-wider uppercase mb-1">Practice Report</p>
          <h1 className="text-2xl font-bold text-text">练习报告</h1>
          <div className="flex items-center gap-3 mt-2 text-sm text-muted">
            <span className="font-medium text-text">{session.scenarioName}</span>
            <span className="w-1 h-1 rounded-full bg-gray-300" />
            <span>{session.duration}</span>
            <span className="w-1 h-1 rounded-full bg-gray-300" />
            <span className="inline-flex items-center gap-1">
              <span className={`text-lg font-bold ${
                session.score >= 80 ? 'text-green-500' : session.score >= 60 ? 'text-amber-500' : 'text-red-500'
              }`}>{session.score}</span>
              分
            </span>
          </div>
        </div>
        <div className="flex gap-2.5">
          <button
            onClick={() => navigate('/history')}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-muted border border-gray-200 hover:border-gray-300 bg-white/80 transition-colors"
          >
            返回历史记录
          </button>
          <button
            onClick={handlePreview}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-primary border border-primary/30 hover:bg-primary-50 transition-colors"
          >
            预览报告
          </button>
          <button
            onClick={handleExport}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-blue-800 bg-hero-gradient hover:shadow-lg transition-all shadow-sm"
          >
            导出PDF
          </button>
        </div>
      </div>

      {/* Top Stats & Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Score Summary */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-text mb-8">得分概览</h3>
          <div className="flex items-center justify-around">
            <ScoreRing value={session.radarData.pronunciation} label="发音" />
            <ScoreRing value={session.radarData.grammar} label="语法" />
            <ScoreRing value={session.feedback.fluency} label="流利度" />
          </div>
        </div>

        {/* Radar Chart */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-text mb-2">能力雷达图</h3>
          <RadarChart data={session.radarData} />
        </div>
      </div>

      {/* Session Summary — after-lesson review */}
      {session.summary && (
        <div className="glass-card rounded-2xl p-6 mb-6">
          <h3 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M15 12h.01M9 16h3.75M15 16h.01M9 20h3.75M15 20h.01M4 4h16a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1z" />
            </svg>
            课后总结
          </h3>
          <p className="text-text text-sm leading-relaxed mb-6 bg-primary-50/50 rounded-xl p-4 border border-primary/10">
            {session.summary.overall}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Strengths */}
            <div>
              <h4 className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" /></svg>
                优点
              </h4>
              <ul className="space-y-2">
                {session.summary.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-text">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            {/* Improvements */}
            <div>
              <h4 className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
                待改进
              </h4>
              <ul className="space-y-2">
                {session.summary.improvements.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-text">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            {/* Tips */}
            <div>
              <h4 className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
                学习建议
              </h4>
              <ul className="space-y-2">
                {session.summary.tips.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-text">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Feedback + Conversation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-text mb-4">对话记录</h3>
          <div className="max-h-[500px] overflow-y-auto">
            {session.conversation.length === 0 ? (
              <p className="text-muted text-sm py-16 text-center">暂无对话记录。</p>
            ) : (
              session.conversation.map((msg, i) => (
                <ChatBubble key={i} role={msg.role} message={msg.message} />
              ))
            )}
          </div>
        </div>

        <div>
          <FeedbackPanel
            data={session.feedback}
            correction={session.correction}
            pronunciation={session.pronunciation}
            vocabulary={session.vocabulary}
          />
        </div>
      </div>
    </div>
  );
}