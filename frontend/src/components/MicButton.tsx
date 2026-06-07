import { useRef, useState } from 'react';
import { transcribeSpeech } from '../api/speech';

interface Props {
  onTranscription: (text: string) => void;
}

type Status = 'idle' | 'recording' | 'transcribing';

export default function MicButton({ onTranscription }: Props) {
  const [status, setStatus] = useState<Status>('idle');
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorder.current = recorder;
      chunks.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (chunks.current.length === 0) {
          setStatus('idle');
          return;
        }

        const blob = new Blob(chunks.current, { type: 'audio/webm' });
        setStatus('transcribing');
        try {
          const text = await transcribeSpeech(blob);
          if (text) onTranscription(text);
        } catch {
          // silently fail — user can type instead
        }
        setStatus('idle');
      };

      recorder.start();
      setStatus('recording');
    } catch {
      // microphone not available — user can type instead
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current?.state === 'recording') {
      mediaRecorder.current.stop();
    }
  };

  const handleClick = () => {
    if (status === 'idle') startRecording();
    else if (status === 'recording') stopRecording();
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative flex items-center justify-center" style={{ width: 80, height: 80 }}>
        {status === 'recording' && (
          <>
            <span className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
            <span className="absolute inset-2 rounded-full bg-primary/15 animate-pulse" />
          </>
        )}

        {status === 'transcribing' ? (
          <button
            disabled
            className="relative z-10 w-12 h-12 rounded-full flex items-center justify-center bg-gray-400 shadow-md cursor-wait"
          >
            <svg className="w-6 h-6 text-blue-800 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M12 2a10 10 0 100 20 10 10 0 000-20z" opacity={0.3} />
              <path d="M12 2a10 10 0 019.95 9" />
            </svg>
          </button>
        ) : (
          <button
            onClick={handleClick}
            className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-md ${
              status === 'recording'
                ? 'bg-red-500 scale-110 shadow-red-200'
                : 'bg-primary hover:bg-blue-700 hover:scale-105 shadow-blue-200'
            }`}
          >
            <svg className="w-6 h-6 text-blue-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {status === 'recording' ? (
                <rect x="6" y="6" width="12" height="12" rx="1" fill="currentColor" />
              ) : (
                <path d="M12 2a3 3 0 00-3 3v6a3 3 0 006 0V5a3 3 0 00-3-3z" />
              )}
            </svg>
          </button>
        )}
      </div>
      <span className="text-xs font-medium text-muted select-none">
        {status === 'idle' && '点击说话'}
        {status === 'recording' && '点击结束'}
        {status === 'transcribing' && '识别中...'}
      </span>
    </div>
  );
}