import type { Scenario } from '../types';

interface Props {
  scenario: Scenario;
  selected: boolean;
  onSelect: (id: number) => void;
}

const difficultyColors: Record<Scenario['difficulty'], string> = {
  简单: 'bg-green-50 text-green-700 border-green-200',
  中等: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  困难: 'bg-red-50 text-red-700 border-red-200',
};

const sceneConfig: Record<string, { emoji: string; bg: string; label: string; accent: string }> = {
  面试: { emoji: '👔', bg: 'from-blue-50 to-blue-100', label: 'Interview', accent: 'bg-blue-500' },
  餐厅: { emoji: '🍽️', bg: 'from-orange-50 to-orange-100', label: 'Restaurant', accent: 'bg-orange-500' },
  会议: { emoji: '💼', bg: 'from-purple-50 to-purple-100', label: 'Meeting', accent: 'bg-purple-500' },
  旅行: { emoji: '✈️', bg: 'from-green-50 to-green-100', label: 'Travel', accent: 'bg-green-500' },
};

export default function ScenarioCard({ scenario, selected, onSelect }: Props) {
  const config = sceneConfig[scenario.name] ?? { emoji: '🎯', bg: 'from-gray-50 to-gray-100', label: '', accent: 'bg-gray-500' };

  return (
    <button
      onClick={() => onSelect(scenario.id)}
      className={`w-full rounded-2xl overflow-hidden transition-all duration-200 bg-white hover:shadow-lg active:scale-[0.97] ${
        selected
          ? 'ring-2 ring-primary ring-offset-2 shadow-lg'
          : 'shadow-sm hover:-translate-y-0.5'
      }`}
    >
      {/* Character illustration area */}
      <div className={`relative h-32 bg-gradient-to-br ${config.bg} flex items-center justify-center`}>
        {/* Decorative circles */}
        <div className={`absolute top-3 right-3 w-3 h-3 rounded-full ${config.accent} opacity-30`} />
        <div className="absolute bottom-4 left-4 w-5 h-5 rounded-full border-2 border-white/40" />
        <div className="absolute top-4 left-8 w-2 h-2 rounded-full bg-white/30" />
        {/* Character */}
        <div className="relative">
          <div className="absolute inset-0 bg-white/20 rounded-full scale-110" />
          <span className="relative text-5xl select-none drop-shadow-sm">{config.emoji}</span>
        </div>
        <span className="absolute bottom-2 right-3 text-gray-400 text-xs font-medium uppercase tracking-wide">
          {config.label}
        </span>
      </div>

      {/* Info area */}
      <div className="p-4 text-center">
        <p className="font-semibold text-text text-base">{scenario.name}</p>
      </div>
    </button>
  );
}