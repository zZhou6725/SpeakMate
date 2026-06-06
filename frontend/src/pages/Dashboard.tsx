import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useMockData } from '../hooks/useMockData';
import { dashboardStats } from '../mock/mock_data';
import ScenarioCard from '../components/ScenarioCard';
import ScoreRing from '../components/ScoreRing';
import LoadingPlaceholder from '../components/LoadingPlaceholder';
import type { DashboardStats } from '../types';

export default function Dashboard() {
  const navigate = useNavigate();
  const { scenarios, selectedScenarioId, selectScenario, startSession } = useStore();
  const { data, loading } = useMockData<DashboardStats>(() => dashboardStats, 400);

  const handleStart = () => {
    if (!selectedScenarioId) return;
    startSession();
    navigate('/practice');
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text">欢迎回来</h1>
        <p className="text-muted mt-1">准备好练习英语了吗？</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <LoadingPlaceholder key={i} type="card" />
            ))
          : data && (
              <>
                <StatCard label="练习总次数" value={data.totalPractice} />
                <StatCard label="平均得分" value={data.averageScore} />
                <StatCard label="最高得分" value={data.bestScore} suffix="分" />
              </>
            )}
      </div>

      {/* Score Ring Preview */}
      {!loading && data && (
        <div className="flex justify-center mb-8">
          <ScoreRing value={data.averageScore} label="综合" size={100} />
        </div>
      )}

      {/* Scenario Selection */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-text mb-4">选择场景</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {scenarios.map((s) => (
            <ScenarioCard
              key={s.id}
              scenario={s}
              selected={s.id === selectedScenarioId}
              onSelect={selectScenario}
            />
          ))}
        </div>
      </div>

      {/* Start Button */}
      <div className="flex justify-center">
        <button
          onClick={handleStart}
          disabled={!selectedScenarioId}
          className={`px-10 py-3 rounded-card text-white font-semibold text-base transition-all duration-200 ${
            selectedScenarioId
              ? 'bg-primary hover:bg-blue-700 shadow-md hover:shadow-lg active:scale-[0.98]'
              : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          开始练习
        </button>
      </div>
    </div>
  );
}

function StatCard({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
  return (
    <div className="bg-white rounded-card p-5 shadow-sm border border-gray-100 text-center">
      <p className="text-xs text-muted font-medium uppercase tracking-wide mb-2">{label}</p>
      <p className="text-3xl font-bold text-text">
        {value}
        {suffix && <span className="text-lg text-muted">{suffix}</span>}
      </p>
    </div>
  );
}