import type {
  Scenario,
  ChatMessage,
  FeedbackData,
  RadarData,
  DashboardStats,
  HistoryEntry,
  HistoryFiltersType,
  PracticeSession,
} from '../types';

// ─── Dashboard Stats ────────────────────────────────────
export const dashboardStats: DashboardStats = {
  totalPractice: 28,
  averageScore: 84,
  bestScore: 92,
};

// ─── Scenarios ──────────────────────────────────────────
export const scenarios: Scenario[] = [
  { id: 1, name: '面试', difficulty: '中等' },
  { id: 2, name: '餐厅', difficulty: '简单' },
  { id: 3, name: '会议', difficulty: '困难' },
  { id: 4, name: '旅行', difficulty: '简单' },
];

// ─── Conversations ──────────────────────────────────────
export const conversation: ChatMessage[] = [
  { role: 'ai', message: '请简单介绍一下你自己。' },
  { role: 'user', message: '我是一名软件工程专业的学生。' },
  { role: 'ai', message: '你为什么选择了这个专业？' },
  { role: 'user', message: '我一直对技术和解决问题的过程充满热情。' },
  { role: 'ai', message: '你的优点和缺点是什么？' },
  { role: 'user', message: '我的优点是学习能力强、善于团队合作；缺点是需要提高公开演讲能力。' },
  { role: 'ai', message: '五年后你希望自己是什么样的？' },
  { role: 'user', message: '我希望能成为一名高级工程师，带领一个小团队。' },
  { role: 'ai', message: '很好！下面我来给你一些关于刚才回答的反馈。' },
];

// ─── Feedback ───────────────────────────────────────────
export const feedback: FeedbackData = {
  grammar: 82,
  pronunciation: 87,
  fluency: 85,
};

// ─── Radar Data ─────────────────────────────────────────
export const radarData: RadarData = {
  pronunciation: 87,
  grammar: 82,
  vocabulary: 84,
  fluency: 85,
  confidence: 83,
};

// ─── History ────────────────────────────────────────────
export const history: HistoryEntry[] = [
  { id: 1, date: '2026-06-05', scenario: '面试', score: 85, duration: '11分钟' },
  { id: 2, date: '2026-06-04', scenario: '餐厅', score: 78, duration: '8分钟' },
  { id: 3, date: '2026-06-03', scenario: '会议', score: 91, duration: '15分钟' },
  { id: 4, date: '2026-06-02', scenario: '旅行', score: 82, duration: '10分钟' },
  { id: 5, date: '2026-06-01', scenario: '面试', score: 88, duration: '12分钟' },
  { id: 6, date: '2026-05-30', scenario: '餐厅', score: 75, duration: '9分钟' },
  { id: 7, date: '2026-05-29', scenario: '会议', score: 86, duration: '14分钟' },
  { id: 8, date: '2026-05-28', scenario: '旅行', score: 90, duration: '13分钟' },
];

// ─── History Filters ────────────────────────────────────
export const historyFilters: HistoryFiltersType = {
  scenarios: ['全部', '面试', '餐厅', '会议', '旅行'],
  timeRanges: ['本周', '本月', '全部'],
};

// ─── Practice Sessions (for report detail) ─────────────
export const practiceSessions: PracticeSession[] = [
  {
    id: 1,
    scenarioId: 1,
    scenarioName: '面试',
    conversation,
    feedback,
    radarData,
    score: 85,
    duration: '11分钟',
  },
  {
    id: 2,
    scenarioId: 2,
    scenarioName: '餐厅',
    conversation: [
      { role: 'ai', message: '欢迎光临！请问需要点些什么？' },
      { role: 'user', message: '我想要一杯咖啡和一个三明治。' },
      { role: 'ai', message: '还需要其他的吗？' },
      { role: 'user', message: '不用了，这些就够了，谢谢。' },
    ],
    feedback: { grammar: 75, pronunciation: 80, fluency: 78 },
    radarData: { pronunciation: 80, grammar: 75, vocabulary: 76, fluency: 78, confidence: 81 },
    score: 78,
    duration: '8分钟',
  },
  {
    id: 3,
    scenarioId: 3,
    scenarioName: '会议',
    conversation: [
      { role: 'ai', message: '我们来讨论一下第三季度的项目时间表。' },
      { role: 'user', message: '我认为我们应该优先推进移动端的发布。' },
      { role: 'ai', message: '你能详细说明一下为什么移动端是优先事项吗？' },
      { role: 'user', message: '我们的用户数据显示 70% 的流量来自移动设备。' },
    ],
    feedback: { grammar: 90, pronunciation: 92, fluency: 88 },
    radarData: { pronunciation: 92, grammar: 90, vocabulary: 89, fluency: 88, confidence: 91 },
    score: 91,
    duration: '15分钟',
  },
  {
    id: 4,
    scenarioId: 4,
    scenarioName: '旅行',
    conversation: [
      { role: 'ai', message: '你好！请问你要去哪里？' },
      { role: 'user', message: '我想订一张去北京的机票。' },
      { role: 'ai', message: '你计划什么时候出发？' },
      { role: 'user', message: '下周一早上，最好是直飞航班。' },
      { role: 'ai', message: '好的，我帮你查一下可选航班。' },
    ],
    feedback: { grammar: 80, pronunciation: 83, fluency: 81 },
    radarData: { pronunciation: 83, grammar: 80, vocabulary: 82, fluency: 81, confidence: 85 },
    score: 82,
    duration: '10分钟',
  },
];

// Helper: get session by id
export function getSessionById(id: number): PracticeSession | undefined {
  return practiceSessions.find((s) => s.id === id);
}

// Helper: get default scenario conversations
export function getConversationByScenario(scenarioId: number): ChatMessage[] {
  const session = practiceSessions.find((s) => s.scenarioId === scenarioId);
  return session?.conversation ?? conversation;
}