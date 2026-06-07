import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import ScenarioCard from '../components/ScenarioCard';

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    scenarios,
    scenariosLoading,
    scenariosError,
    loadScenarios,
    dashboardStats,
    dashboardLoading,
    loadDashboardStats,
    selectedScenarioId,
    selectScenario,
    selectedDifficulty,
    selectDifficulty,
    startSession,
  } = useStore();
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    loadScenarios();
    loadDashboardStats();
  }, [loadScenarios, loadDashboardStats]);

  const handleStart = async () => {
    if (!selectedScenarioId || starting) return;
    setStarting(true);
    try {
      await startSession();
      navigate('/practice');
    } catch {
      setStarting(false);
    }
  };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="mb-8 text-center">
        <p className="text-sm font-medium text-primary tracking-wide uppercase">Welcome Back</p>
        <h1 className="text-2xl font-bold text-text mt-1">欢迎回来</h1>
        <p className="text-muted text-sm mt-2">Ready to practice English today?</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-5 mb-10 max-w-2xl mx-auto w-full">
        {dashboardLoading ? (
          <>
            <StatCard label="总练习场次" value={0} />
            <StatCard label="平均得分" value={0} />
            <StatCard label="历史最高分" value={0} />
          </>
        ) : (
          <>
            <StatCard label="总练习场次" value={dashboardStats.totalPractice} />
            <StatCard label="平均得分" value={dashboardStats.averageScore} />
            <StatCard label="历史最高分" value={dashboardStats.bestScore} />
          </>
        )}
      </div>

      {/* Scenario Selection */}
      <h2 className="text-lg font-semibold text-text mb-4 text-center">选择场景</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto w-full mb-10">
        {scenariosLoading ? (
          <div className="col-span-full text-center text-muted text-sm py-8">
            加载场景中...
          </div>
        ) : scenariosError ? (
          <div className="col-span-full text-center text-red-500 text-sm py-8">
            加载失败：{scenariosError}
          </div>
        ) : (
          scenarios.map((s) => (
            <ScenarioCard
              key={s.id}
              scenario={s}
              selected={s.id === selectedScenarioId}
              onSelect={selectScenario}
            />
          ))
        )}
      </div>

      {/* Difficulty Selection */}
      <h2 className="text-lg font-semibold text-text mb-4 text-center">选择难度</h2>
      <div className="flex justify-center gap-3 mb-10">
        {(['简单', '中等', '困难'] as const).map((d) => (
          <button
            key={d}
            onClick={() => selectDifficulty(d)}
            className={`px-6 py-3 rounded-card text-sm font-medium transition-all duration-200 border-2 min-w-[100px] ${
              selectedDifficulty === d
                ? 'border-primary bg-primary/5 text-primary shadow-sm'
                : 'border-gray-200 bg-white text-muted hover:border-gray-300'
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Start Button */}
      <div className="flex justify-center">
        <button
          onClick={handleStart}
          disabled={!selectedScenarioId || starting}
          className={`px-20 py-4 rounded-2xl text-white font-semibold text-lg transition-all duration-200 min-w-[280px] ${
            selectedScenarioId && !starting
              ? 'bg-primary hover:bg-blue-700 shadow-lg hover:shadow-xl active:scale-[0.98]'
              : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          {starting ? '正在创建会话...' : '开始练习'}
        </button>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
      <div className="flex justify-center mb-3">
        <svg className="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
        </svg>
      </div>
      <p className="text-2xl font-bold text-text">{value}</p>
      <p className="text-xs text-muted font-medium mt-1">{label}</p>
    </div>
  );
}
