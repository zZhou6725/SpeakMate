import { useState } from 'react';

export default function MicButton() {
  const [recording, setRecording] = useState(false);

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Large mic circle with ripple */}
      <div className="relative flex items-center justify-center" style={{ width: 160, height: 160 }}>
        {recording && (
          <>
            <span className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
            <span className="absolute inset-3 rounded-full bg-primary/15 animate-pulse" />
            <span className="absolute inset-6 rounded-full bg-primary/20" />
          </>
        )}
        <button
          onClick={() => setRecording((r) => !r)}
          className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
            recording
              ? 'bg-red-500 scale-110 shadow-red-200'
              : 'bg-primary hover:bg-blue-700 hover:scale-105 shadow-blue-200'
          }`}
        >
          <svg
            className="w-8 h-8 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            {recording ? (
              <rect x="6" y="6" width="12" height="12" rx="1" fill="currentColor" />
            ) : (
              <path d="M12 2a3 3 0 00-3 3v6a3 3 0 006 0V5a3 3 0 00-3-3z" />
            )}
          </svg>
        </button>
      </div>
      <span className="text-sm font-medium text-muted select-none">
        {recording ? '点击结束' : '点击说话'}
      </span>
    </div>
  );
}