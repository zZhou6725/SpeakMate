import type { FeedbackData } from '../types';

interface Props {
  data: FeedbackData;
}

const barConfig: { key: keyof FeedbackData; label: string }[] = [
  { key: 'pronunciation', label: '发音' },
  { key: 'grammar', label: '语法' },
  { key: 'fluency', label: '流利度' },
];

export default function FeedbackPanel({ data }: Props) {
  return (
    <div className="bg-white rounded-card p-4 shadow-sm border border-gray-100">
      <h3 className="text-sm font-semibold text-text mb-4">实时反馈</h3>
      <div className="space-y-3">
        {barConfig.map(({ key, label }) => (
          <div key={key}>
            <div className="flex justify-between text-xs text-muted mb-1">
              <span>{label}</span>
              <span>{data[key]}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                style={{ width: `${data[key]}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}