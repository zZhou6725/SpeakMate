# SpeakMate

AI 英语口语陪练应用 — 场景化对话练习，支持面试/餐厅/会议/旅行四种场景。

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand |
| 后端 | FastAPI + SQLAlchemy async + SQLite + Alembic |
| AI | DeepSeek / Qwen / OpenAI 多厂商 LLM，自动降级兜底 |
| 语音 | Web Speech API (TTS) + Whisper (STT) |
| Python | 3.13 |

## 项目结构

```
speakMate/
├── backend/
│   ├── .env                      # 环境变量（LLM Key、模型等）
│   ├── requirements.txt          # Python 依赖
│   ├── alembic.ini               # 数据库迁移配置
│   ├── alembic/                  # 迁移脚本
│   ├── data/speakmate.db         # SQLite 数据库（自动生成）
│   └── app/
│       ├── main.py               # FastAPI 应用入口，CORS，lifespan
│       ├── core/
│       │   ├── config.py         # 配置类（自动读取 .env）
│       │   ├── database.py       # 数据库引擎 + 会话工厂
│       │   └── logging_config.py # 统一日志配置（控制台 + 文件轮转）
│       ├── models/
│       │   ├── base.py           # ORM 基类 + TimestampMixin
│       │   ├── practice_session.py  # 练习会话表
│       │   ├── dialogue.py       # 对话记录表
│       │   └── evaluation.py     # 评测记录表
│       ├── schemas/
│       │   ├── scenario.py       # 场景响应结构
│       │   ├── dashboard.py      # 仪表盘响应结构
│       │   ├── history.py        # 历史记录响应结构
│       │   ├── chat.py           # 会话/对话/反馈/总结响应结构
│       │   ├── correction.py     # 语法纠错响应结构
│       │   └── pronunciation.py  # 发音评测响应结构
│       ├── api/
│       │   ├── router.py         # 路由聚合
│       │   ├── scenarios.py      # GET /api/scenarios
│       │   ├── dashboard.py      # GET /api/dashboard/stats
│       │   ├── history.py        # GET /api/history + /api/history/filters
│       │   ├── chat.py           # POST /api/sessions + /messages + /end
│       │   ├── report.py         # GET /api/reports/{id} + /preview + /pdf + /export
│       │   ├── speech.py         # POST /api/speech (Whisper 语音识别 + 音频评分)
│       │   ├── correction.py     # POST /api/correction
│       │   └── pronunciation.py  # POST /api/pronunciation
│       ├── services/
│       │   ├── llm_service.py        # LLM API 调用封装（OpenAI 兼容格式）
│       │   ├── report_exporter.py    # PDF 报告生成（ReportLab）
│       │   └── audio_analyzer.py     # 音频级发音评分（语速/音高/能量/停顿）
│       ├── agents/
│       │   ├── conversation_agent.py # 场景化对话引擎（System Prompt + 降级）
│       │   ├── correction_agent.py   # 语法纠错代理
│       │   ├── pronunciation_agent.py # 发音评测代理（LLM 文本分析）
│       │   └── summary_agent.py      # 课后总结代理
│       └── utils/
│           └── seed_data.py      # 种子数据
├── frontend/
│   └── src/
│       ├── api/                  # HTTP 请求层
│       ├── pages/                # 页面组件（Dashboard/PracticeRoom/History/Report）
│       ├── components/           # 通用组件
│       ├── hooks/                # 自定义 Hooks（useSpeech）
│       ├── utils/                # 工具函数（cleanText）
│       ├── store/                # Zustand 状态管理
│       └── types/                # TypeScript 类型定义
└── docs/
```

## API 接口

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/health` | 健康检查 |
| GET | `/api/scenarios` | 场景列表（面试/餐厅/会议/旅行） |
| GET | `/api/dashboard/stats` | 仪表盘统计（练习次数/平均分/最高分） |
| GET | `/api/history` | 历史记录列表（支持 scenario/timeRange 筛选） |
| GET | `/api/history/filters` | 筛选器选项 |
| POST | `/api/sessions` | 创建练习会话（含难度分档开场白） |
| POST | `/api/sessions/{id}/messages` | 发送消息（SSE 流式返回 + 语法/发音分析） |
| POST | `/api/sessions/{id}/end` | 结束会话（生成评分 + 课后总结） |
| GET | `/api/reports/{id}` | 查看报告（含纠错/发音/词汇/总结） |
| GET | `/api/reports/{id}/preview` | 报告 HTML 预览 |
| GET | `/api/reports/{id}/pdf` | 报告 PDF 内嵌 |
| GET | `/api/reports/{id}/export` | 下载报告 PDF |
| POST | `/api/speech` | 语音识别（Whisper 转录 + 音频发音评分） |
| POST | `/api/correction` | 语法纠错（独立调用） |
| POST | `/api/pronunciation` | 发音评测（独立调用） |

## LLM 对话引擎

对话流程：用户发消息 → generate_ai_reply() → 判断 LLM 是否已配置：

- **LLM 可用**：构建场景 System Prompt + 历史上下文 → 调用 DeepSeek/Qwen/OpenAI API → 返回真实 AI 回复
- **LLM 不可用**：自动降级为预置脚本模板，对话正常继续

四个场景各有独立的 System Prompt（面试 HR / 餐厅服务员 / 项目经理 / 旅行代理），支持简单/中等/困难三档难度控制词汇和句式复杂度。

切换 LLM 厂商只需修改 `.env`：

```env
# DeepSeek
LLM_API_KEY=sk-xxx
LLM_BASE_URL=https://api.deepseek.com
LLM_MODEL=deepseek-chat

# Qwen
LLM_API_KEY=your-dashscope-key
LLM_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
LLM_MODEL=qwen-plus

# OpenAI
LLM_API_KEY=sk-xxx
LLM_BASE_URL=https://api.openai.com
LLM_MODEL=gpt-4o
```

## 启动

**后端**：

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env   # 编辑填入 API Key
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

**前端**：

```bash
cd frontend
npm install
npm run dev
```

浏览器打开 http://localhost:5173 。

## 已完成功能

### 核心流程
- 四种场景选择 + 仪表盘统计
- 完整练习流程：创建会话 → 多轮对话 → 结束评分 → 报告查看
- 历史记录查询与筛选
- LLM 智能对话（多厂商支持 + 自动降级）
- 前端全部数据从 API 加载

### 语音能力
- 语音输入（MicButton → Whisper 转录）
- AI 语音播报（Web Speech API TTS，自动朗读 + 逐条重播）
- 音频级发音评分（语速/音高/能量/停顿分析）
- 文本级发音分析（LLM 识别中国学习者常见发音难点）

### 语法与反馈
- 语法纠错（LLM 分析 + 逐条纠错建议）
- 纠错面板（报告页展示错误单词/纠正/原因）
- 发音详情面板（报告页展示难点词/音标/发音技巧）

### 评分与报告
- 真实评分算法（基于语法纠错 + 发音分数推导）
- 词汇统计（总词数/不重复词/平均词长/准确率）
- 能力雷达图（发音/语法/词汇/流利度/自信度）
- PDF 报告导出（ReportLab，含对话记录/纠错/发音指导）
- 报告预览 + 下载

### 课后总结
- LLM 生成中文课后总结（总体评价 + 优点 + 待改进 + 学习建议）
- LLM 不可用时自动降级为模板

### 难度差异化
- 开场白按简单/中等/困难三档（短句基础词 → 长难句专业词）
- AI 回复风格三档：简单附中文翻译，困难带追问深度
- UI 显眼彩色难度标签（Easy/Medium/Hard）

### UI 与体验
- 企业级蓝色渐变主题 + 毛玻璃卡片
- 暂停/重置会话
- 深蓝色统一文字风格
- 前端死代码清理

### 基础设施
- Alembic 数据库迁移
- 统一日志系统（控制台 + 文件轮转）
- 历史记录时间筛选（本周/本月/全部）
