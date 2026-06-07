/** Clean text for TTS: strip emojis, convert time/date formats to spoken English. */

export function cleanForSpeech(text: string): string {
  let t = text;

  // Strip emojis and emoticons
  t = t.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2300}-\u{23FF}\u{2B50}\u{2B55}\u{231A}\u{231B}\u{2328}\u{23CF}\u{23E9}-\u{23F3}\u{23F8}-\u{23FA}\u{FE0F}\u{200D}]/gu, '');

  // Strip common emoticons
  t = t.replace(/[:;=][\-^]?[)D(\]\[pP\/\\|@\*$]+/g, '');

  // Convert HH:MM to spoken English
  t = t.replace(/\b(\d{1,2}):(\d{2})\b/g, (_m: string, h: string, m: string) => {
    const hour = parseInt(h);
    const min = parseInt(m);
    if (hour === 0 && min === 0) return 'midnight';
    if (hour === 12 && min === 0) return 'noon';
    if (min === 0) return `${hour} o'clock`;
    if (min === 30) return `half past ${hour}`;
    if (min === 15) return `quarter past ${hour}`;
    if (min === 45) return `quarter to ${hour + 1}`;
    return `${hour} ${min}`;
  });

  // Convert AM/PM times: "8:00 AM" → "eight in the morning"
  t = t.replace(/(\d{1,2}):(\d{2})\s*[Aa][Mm]/g, (_m: string, h: string, _min: string) => {
    const hour = parseInt(h);
    if (hour < 12) return `${hour} in the morning`;
    if (hour === 12) return 'noon';
    return `${hour - 12} in the afternoon`;
  });
  t = t.replace(/(\d{1,2}):(\d{2})\s*[Pp][Mm]/g, (_m: string, h: string, _min: string) => {
    const hour = parseInt(h);
    if (hour === 12) return 'noon';
    if (hour < 6) return `${hour} in the afternoon`;
    return `${hour} in the evening`;
  });

  // Convert standalone time words
  t = t.replace(/\b(\d{1,2})\s*[Aa][Mm]\b/g, (_m: string, h: string) => {
    const hour = parseInt(h);
    if (hour === 12) return 'noon';
    if (hour < 12) return `${hour} in the morning`;
    return `${hour}`;
  });
  t = t.replace(/\b(\d{1,2})\s*[Pp][Mm]\b/g, (_m: string, h: string) => {
    const hour = parseInt(h);
    if (hour === 12) return 'noon';
    if (hour < 6) return `${hour} in the afternoon`;
    return `${hour} in the evening`;
  });

  // Convert dates: "6/10" or "06/10" → "June tenth"
  t = t.replace(/\b(\d{1,2})\/(\d{1,2})\b/g, 'the date');

  // Strip markdown
  t = t.replace(/\*\*(.+?)\*\*/g, '$1');
  t = t.replace(/\*(.+?)\*/g, '$1');
  t = t.replace(/`(.+?)`/g, '$1');
  t = t.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // Strip HTML
  t = t.replace(/<[^>]+>/g, '');

  // Collapse multiple spaces
  t = t.replace(/\s+/g, ' ').trim();

  return t;
}