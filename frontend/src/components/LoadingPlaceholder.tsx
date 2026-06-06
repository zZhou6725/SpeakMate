interface Props {
  type?: 'card' | 'text' | 'chart';
  lines?: number;
}

export default function LoadingPlaceholder({ type = 'text', lines = 3 }: Props) {
  if (type === 'card') {
    return (
      <div className="bg-white rounded-card p-6 shadow-sm animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="h-3 bg-gray-100 rounded w-full mb-2" />
        <div className="h-3 bg-gray-100 rounded w-4/5 mb-2" />
        <div className="h-3 bg-gray-100 rounded w-2/3" />
      </div>
    );
  }

  if (type === 'chart') {
    return (
      <div className="bg-white rounded-card p-6 shadow-sm animate-pulse flex items-center justify-center" style={{ minHeight: 280 }}>
        <div className="w-48 h-48 rounded-full bg-gray-100" />
      </div>
    );
  }

  return (
    <div className="animate-pulse space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3 bg-gray-200 rounded"
          style={{ width: `${85 - i * 12}%` }}
        />
      ))}
    </div>
  );
}