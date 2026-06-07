import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import type { HistoryEntry } from '../types';

export default function History() {
  const navigate = useNavigate();
  const {
    selectScenario,
    startSession,
    history,
    historyFilters,
    historyLoading,
    loadHistory,
    loadHistoryFilters,
  } = useStore();

  const [scenarioFilter, setScenarioFilter] = useState('全部');
  const [timeFilter, setTimeFilter] = useState('全部');

  useEffect(() => {
    loadHistoryFilters();
    loadHistory();
  }, [loadHistoryFilters, loadHistory]);

  const handleFilterScenario = (s: string) => {
    setScenarioFilter(s);
    loadHistory({
      scenario: s !== '全部' ? s : undefined,
      timeRange: timeFilter !== '全部' ? timeFilter : undefined,
    });
  };

  const handleFilterTime = (t: string) => {
    setTimeFilter(t);
    loadHistory({
      scenario: scenarioFilter !== '全部' ? scenarioFilter : undefined,
      timeRange: t !== '全部' ? t : undefined,
    });
  };

  const handleViewReport = (id: number) => {
    navigate(`/report?id=${id}`);
  };

  const handleReplay = (entry: HistoryEntry) => {
    const scenario = useStore.getState().scenarios.find((s) => s.name === entry.scenario);
    if (scenario) {
      selectScenario(scenario.id);
      startSession();
      navigate('/practice');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <p className="text-sm font-semibold text-primary tracking-wider uppercase mb-1">Practice Records</p>
        <h1 className="text-2xl font-bold text-text">历史记录</h1>
        <p className="text-muted mt-1 text-sm">查看过往练习记录与成绩</p>
      </div>

      {/* Filters */}
      <div className="glass-card rounded-2xl p-4 mb-6">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">场景</span>
            <div className="flex gap-1.5">
              {historyFilters.scenarios.map((s) => (
                <button
                  key={s}
                  onClick={() => handleFilterScenario(s)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    scenarioFilter === s
                      ? 'bg-hero-gradient text-white shadow-sm'
                      : 'bg-white text-muted border border-gray-100 hover:border-primary/30 hover:text-primary'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="w-px h-6 bg-gray-200" />
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">时间</span>
            <div className="flex gap-1.5">
              {historyFilters.timeRanges.map((t) => (
                <button
                  key={t}
                  onClick={() => handleFilterTime(t)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    timeFilter === t
                      ? 'bg-hero-gradient text-white shadow-sm'
                      : 'bg-white text-muted border border-gray-100 hover:border-primary/30 hover:text-primary'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-primary/5 bg-primary-50/50 text-left text-xs font-semibold text-primary/70 uppercase tracking-wider">
              <th className="px-6 py-4">日期</th>
              <th className="px-6 py-4">场景</th>
              <th className="px-6 py-4">总分</th>
              <th className="px-6 py-4">练习时长</th>
              <th className="px-6 py-4">语法</th>
              <th className="px-6 py-4">发音</th>
              <th className="px-6 py-4 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {historyLoading ? (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center text-muted text-sm">
                  加载中...
                </td>
              </tr>
            ) : history.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center">
                  <p className="text-muted text-sm mb-2">暂无练习记录</p>
                  <p className="text-muted/60 text-xs">开始你的第一次练习吧</p>
                </td>
              </tr>
            ) : (
              history.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-b border-gray-50 hover:bg-primary-50/30 transition-colors"
                >
                  <td className="px-6 py-4 text-text font-medium">{entry.date}</td>
                  <td className="px-6 py-4 text-muted">{entry.scenario}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center justify-center w-9 h-9 rounded-xl text-xs font-bold text-white ${
                      entry.score >= 80 ? 'bg-gradient-to-br from-green-400 to-green-500' :
                      entry.score >= 60 ? 'bg-gradient-to-br from-amber-400 to-amber-500' :
                      'bg-gradient-to-br from-red-400 to-red-500'
                    }`}>
                      {entry.score}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted">{entry.duration}</td>
                  <td className="px-6 py-4 text-muted">{entry.grammar}</td>
                  <td className="px-6 py-4 text-muted">{entry.pronunciation}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleViewReport(entry.id)}
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-hero-gradient hover:shadow-md transition-all"
                      >
                        查看报告
                      </button>
                      <button
                        onClick={() => handleReplay(entry)}
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-primary bg-primary-50 border border-primary/10 hover:bg-primary-100 transition-colors"
                      >
                        复现练习
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
