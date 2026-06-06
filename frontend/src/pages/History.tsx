import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useMockData } from '../hooks/useMockData';
import { history, historyFilters } from '../mock/mock_data';
import LoadingPlaceholder from '../components/LoadingPlaceholder';
import type { HistoryEntry } from '../types';

export default function History() {
  const navigate = useNavigate();
  const { selectScenario, startSession } = useStore();
  const { data: entries, loading } = useMockData<HistoryEntry[]>(() => history, 400);

  const [scenarioFilter, setScenarioFilter] = useState('全部');
  const [timeFilter, setTimeFilter] = useState('全部');

  const filtered = (entries ?? []).filter((entry) => {
    if (scenarioFilter !== '全部' && entry.scenario !== scenarioFilter) return false;
    return true;
  });

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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text">历史记录</h1>
        <p className="text-muted mt-1">查看过往练习记录。</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted uppercase tracking-wider">场景：</span>
          <div className="flex gap-1">
            {historyFilters.scenarios.map((s) => (
              <button
                key={s}
                onClick={() => setScenarioFilter(s)}
                className={`px-3 py-1.5 rounded-card text-xs font-medium transition-colors ${
                  scenarioFilter === s
                    ? 'bg-primary text-white'
                    : 'bg-white text-muted border border-gray-200 hover:border-gray-300'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted uppercase tracking-wider">时间：</span>
          <div className="flex gap-1">
            {historyFilters.timeRanges.map((t) => (
              <button
                key={t}
                onClick={() => setTimeFilter(t)}
                className={`px-3 py-1.5 rounded-card text-xs font-medium transition-colors ${
                  timeFilter === t
                    ? 'bg-primary text-white'
                    : 'bg-white text-muted border border-gray-200 hover:border-gray-300'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-card shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold text-muted uppercase tracking-wider">
              <th className="px-5 py-3">日期</th>
              <th className="px-5 py-3">场景</th>
              <th className="px-5 py-3">总分</th>
              <th className="px-5 py-3">练习时长</th>
              <th className="px-5 py-3">语法</th>
              <th className="px-5 py-3">发音</th>
              <th className="px-5 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  <td colSpan={7} className="px-5 py-4">
                    <LoadingPlaceholder type="text" lines={1} />
                  </td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-muted text-sm">
                  暂无练习记录。
                </td>
              </tr>
            ) : (
              filtered.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-5 py-4 text-text font-medium">{entry.date}</td>
                  <td className="px-5 py-4 text-muted">{entry.scenario}</td>
                  <td className="px-5 py-4">
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                      {entry.score}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-muted">{entry.duration}</td>
                  <td className="px-5 py-4 text-muted">{entry.grammar}</td>
                  <td className="px-5 py-4 text-muted">{entry.pronunciation}</td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleViewReport(entry.id)}
                        className="px-3 py-1.5 rounded-card text-xs font-medium text-white bg-primary hover:bg-blue-700 transition-colors"
                      >
                        查看报告
                      </button>
                      <button
                        onClick={() => handleReplay(entry)}
                        className="px-3 py-1.5 rounded-card text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 transition-colors"
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