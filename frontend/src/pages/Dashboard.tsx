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
    <div className="flex flex-col py-4">
      {/* Hero section */}
      <div className="mb-12 text-center relative">
        <div className="absolute inset-0 -top-20 -z-10">
          <div className="w-[500px] h-[500px] mx-auto rounded-full bg-gradient-to-br from-primary-200/30 via-primary-100/20 to-transparent blur-3xl" />
        </div>
        <p className="text-sm font-semibold text-primary tracking-[0.2em] uppercase mb-3">AI-Powered English Speaking</p>
        <h1 className="text-4xl font-extrabold text-gradient mb-3">欢迎回来</h1>
        <p className="text-muted text-base">开启你的 AI 英语口语练习之旅</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-6 mb-12 max-w-3xl mx-auto w-full">
        {dashboardLoading ? (
          <>
            <StatCard icon="🔄" label="总练习场次" value={0} />
            <StatCard icon="📊" label="平均得分" value={0} />
            <StatCard icon="🏆" label="历史最高分" value={0} />
          </>
        ) : (
          <>
            <StatCard icon="🎯" label="总练习场次" value={dashboardStats.totalPractice} />
            <StatCard icon="📊" label="平均得分" value={dashboardStats.averageScore} />
            <StatCard icon="🏆" label="历史最高分" value={dashboardStats.bestScore} />
          </>
        )}
      </div>

      {/* Scenario Selection */}
      <div className="mb-12">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-text">选择场景</h2>
          <p className="text-muted text-sm mt-1">四种真实场景，沉浸式口语练习</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto w-full">
          {scenariosLoading ? (
            <div className="col-span-full text-center text-muted text-sm py-8">加载场景中...</div>
          ) : scenariosError ? (
            <div className="col-span-full text-center text-red-500 text-sm py-8">加载失败：{scenariosError}</div>
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
      </div>

      {/* Difficulty Selection */}
      <div className="mb-12 text-center">
        <h2 className="text-xl font-bold text-text mb-2">选择难度</h2>
        <p className="text-muted text-sm mb-5">根据你的英语水平选择合适的难度</p>
        <div className="flex justify-center gap-4">
          {(['简单', '中等', '困难'] as const).map((d) => (
            <button
              key={d}
              onClick={() => selectDifficulty(d)}
              className={`px-8 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 min-w-[120px] ${
                selectedDifficulty === d
                  ? 'bg-primary text-white shadow-lg shadow-primary/25 scale-105'
                  : 'glass-card text-muted hover:text-text hover:shadow-md'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Start Button */}
      <div className="flex justify-center">
        <button
          onClick={handleStart}
          disabled={!selectedScenarioId || starting}
          className={`px-24 py-4 rounded-2xl font-bold text-lg transition-all duration-300 min-w-[300px] ${
            selectedScenarioId && !starting
              ? 'bg-hero-gradient text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98]'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {starting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              正在创建会话...
            </span>
          ) : '开始练习'}
        </button>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: string; label: string; value: number }) {
  return (
    <div className="glass-card rounded-2xl p-6 text-center hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300">
      <div className="text-3xl mb-3">{icon}</div>
      <p className="text-3xl font-extrabold text-gradient">{value}</p>
      <p className="text-xs text-muted font-medium mt-2">{label}</p>
    </div>
  );
}