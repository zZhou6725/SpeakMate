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

export default function ScenarioCard({ scenario, selected, onSelect }: Props) {
  return (
    <button
      onClick={() => onSelect(scenario.id)}
      className={`w-full text-left p-4 rounded-card border-2 transition-all duration-200 bg-white hover:shadow-md ${
        selected
          ? 'border-primary shadow-md ring-1 ring-primary'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="font-semibold text-text">{scenario.name}</span>
        <span
          className={`text-xs px-2 py-0.5 rounded-full border ${difficultyColors[scenario.difficulty]}`}
        >
          {scenario.difficulty}
        </span>
      </div>
    </button>
  );
}