import { useState } from 'react';
import type { FeedbackData } from '../types';
import ScoreRing from './ScoreRing';

interface Props {
  data: FeedbackData;
}

interface CorrectionItem {
  wrong: string;
  correct: string;
  reason: string;
}

const mockCorrections: CorrectionItem[] = [
  { wrong: 'I go to store', correct: 'I go to the store', reason: '缺少冠词' },
  { wrong: 'He speak English', correct: 'He speaks English', reason: '主谓一致' },
  { wrong: 'more better', correct: 'better', reason: '重复比较' },
];

const mockVocabStats = {
  totalWords: 156,
  uniqueWords: 84,
  newWords: 12,
  accuracy: 87,
};

export default function FeedbackPanel({ data }: Props) {
  const [correctionOpen, setCorrectionOpen] = useState(true);
  const [vocabOpen, setVocabOpen] = useState(false);

  return (
    <div className="space-y-3">
      {/* Ring Progress Circles */}
      <div className="bg-white rounded-card p-4 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-text mb-4 text-center">实时反馈</h3>
        <div className="flex justify-center gap-4">
          <ScoreRing value={data.pronunciation} label="发音" size={80} />
          <ScoreRing value={data.grammar} label="语法" size={80} />
          <ScoreRing value={data.fluency} label="流利" size={80} />
        </div>
      </div>

      {/* Correction Panel */}
      <div className="bg-white rounded-card shadow-sm border border-gray-100 overflow-hidden">
        <button
          onClick={() => setCorrectionOpen(!correctionOpen)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
        >
          <span className="text-sm font-semibold text-text">纠错面板</span>
          <svg
            className={`w-4 h-4 text-muted transition-transform duration-200 ${correctionOpen ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {correctionOpen && (
          <div className="px-4 pb-4 space-y-2">
            {mockCorrections.map((item, i) => (
              <div key={i} className="bg-red-50 rounded-lg p-3 border border-red-100">
                <div className="flex items-center gap-2 text-sm mb-1">
                  <span className="line-through text-red-500 font-medium">{item.wrong}</span>
                  <span className="text-muted">→</span>
                  <span className="text-green-600 font-medium">{item.correct}</span>
                </div>
                <p className="text-xs text-muted">{item.reason}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Vocabulary Stats Collapsible */}
      <div className="bg-white rounded-card shadow-sm border border-gray-100 overflow-hidden">
        <button
          onClick={() => setVocabOpen(!vocabOpen)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
        >
          <span className="text-sm font-semibold text-text">词汇统计</span>
          <svg
            className={`w-4 h-4 text-muted transition-transform duration-200 ${vocabOpen ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {vocabOpen && (
          <div className="px-4 pb-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-text">{mockVocabStats.totalWords}</p>
                <p className="text-xs text-muted">总词数</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-text">{mockVocabStats.uniqueWords}</p>
                <p className="text-xs text-muted">不重复词</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-text">{mockVocabStats.newWords}</p>
                <p className="text-xs text-muted">新词</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-text">{mockVocabStats.accuracy}%</p>
                <p className="text-xs text-muted">用词准确率</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}