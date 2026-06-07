import { useState } from 'react';
import type { FeedbackData, GrammarCorrection, PronunciationResult, VocabularyStats } from '../types';
import ScoreRing from './ScoreRing';

interface Props {
  data: FeedbackData;
  correction?: GrammarCorrection | null;
  pronunciation?: PronunciationResult | null;
  vocabulary?: VocabularyStats | null;
}

export default function FeedbackPanel({ data, correction, pronunciation, vocabulary }: Props) {
  const [correctionOpen, setCorrectionOpen] = useState(true);
  const [pronOpen, setPronOpen] = useState(true);
  const [vocabOpen, setVocabOpen] = useState(false);

  const correctionItems = correction?.items ?? [];
  const pronItems = pronunciation?.items ?? [];

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
            {correctionItems.length === 0 ? (
              <p className="text-xs text-muted py-2 text-center">
                {correction ? '未检测到语法错误' : '发送消息后自动检测语法'}
              </p>
            ) : (
              correctionItems.map((item, i) => (
                <div key={i} className="bg-red-50 rounded-lg p-3 border border-red-100">
                  <div className="flex items-center gap-2 text-sm mb-1">
                    <span className="line-through text-red-500 font-medium">{item.wrong}</span>
                    <span className="text-muted">→</span>
                    <span className="text-green-600 font-medium">{item.correct}</span>
                  </div>
                  <p className="text-xs text-muted">{item.reason}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Pronunciation Detail Panel */}
      <div className="bg-white rounded-card shadow-sm border border-gray-100 overflow-hidden">
        <button
          onClick={() => setPronOpen(!pronOpen)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
        >
          <span className="text-sm font-semibold text-text">发音详情</span>
          <svg
            className={`w-4 h-4 text-muted transition-transform duration-200 ${pronOpen ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {pronOpen && (
          <div className="px-4 pb-4 space-y-2">
            {pronItems.length === 0 ? (
              <p className="text-xs text-muted py-2 text-center">
                {pronunciation ? '未检测到发音难点' : '发送消息后自动分析发音'}
              </p>
            ) : (
              pronItems.map((item, i) => (
                <div key={i} className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                  <div className="flex items-center gap-2 text-sm mb-1">
                    <span className="text-blue-700 font-semibold">{item.word}</span>
                    <span className="text-muted text-xs">{item.phonetic}</span>
                  </div>
                  <p className="text-xs text-muted">{item.tip}</p>
                </div>
              ))
            )}
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
                <p className="text-lg font-bold text-text">{vocabulary?.totalWords ?? '—'}</p>
                <p className="text-xs text-muted">总词数</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-text">{vocabulary?.uniqueWords ?? '—'}</p>
                <p className="text-xs text-muted">不重复词</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-text">{vocabulary?.avgWordLength ?? '—'}</p>
                <p className="text-xs text-muted">平均词长</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-text">{vocabulary ? `${vocabulary.accuracy}%` : '—'}</p>
                <p className="text-xs text-muted">用词准确率</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}