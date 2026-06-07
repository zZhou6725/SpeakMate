# SpeakMate

AI 英语口语陪练应用 — 场景化对话练习，支持面试/餐厅/会议/旅行四种场景。

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand |
| 后端 | FastAPI + SQLAlchemy async + SQLite |
| AI | DeepSeek / Qwen / OpenAI 多厂商 LLM，自动降级兜底 |
| Python | 3.13 |

## 项目结构

```
speakMate/
├── backend/
│   ├── .env                      # 环境变量（LLM Key、模型等）
│   ├── requirements.txt          # Python 依赖
│   ├── data/speakmate.db         # SQLite 数据库（自动生成）
│   └── app/
│       ├── main.py               # FastAPI 应用入口，CORS，lifespan
│       ├── core/
│       │   ├── config.py         # 配置类（自动读取 .env）
│       │   └── database.py       # 数据库引擎 + 会话工厂
│       ├── models/
│       │   ├── base.py           # ORM 基类 + TimestampMixin
│       │   ├── practice_session.py  # 练习会话表
│       │   ├── dialogue.py       # 对话记录表
│       │   └── evaluation.py     # 评测记录表
│       ├── schemas/
│       │   ├── scenario.py       # 场景响应结构
│       │   ├── dashboard.py      # 仪表盘响应结构
│       │   ├── history.py        # 历史记录响应结构
│       │   └── chat.py           # 会话/对话/反馈响应结构
│       ├── api/
│       │   ├── router.py         # 路由聚合（5 个子路由）
│       │   ├── scenarios.py      # GET /api/scenarios
│       │   ├── dashboard.py      # GET /api/dashboard/stats
│       │   ├── history.py        # GET /api/history + /api/history/filters
│       │   ├── chat.py           # POST /api/sessions + /messages + /end
│       │   └── report.py         # GET /api/reports/{id} + /export
│       ├── services/
│       │   └── llm_service.py    # LLM API 调用封装（OpenAI 兼容格式）
│       ├── agents/
│       │   └── conversation_agent.py  # 场景化对话引擎（System Prompt + 降级）
│       └── utils/
│           └── seed_data.py      # 种子数据（8 条历史记录）
├── frontend/
│   └── src/
│       ├── api/                  # HTTP 请求层（client + 6 个模块）
│       ├── pages/                # 页面组件（Dashboard/PracticeRoom/History/Report）
│       ├── components/           # 通用组件（ScoreRing/RadarChart 等）
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
| POST | `/api/sessions` | 创建练习会话 |
| POST | `/api/sessions/{id}/messages` | 发送消息 |
| POST | `/api/sessions/{id}/end` | 结束会话 |
| GET | `/api/reports/{id}` | 查看报告 |
| GET | `/api/reports/{id}/export` | 导出报告（占位） |

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

- 四种场景选择 + 仪表盘统计
- 完整练习流程：创建会话 → 多轮对话 → 结束评分 → 报告查看
- 历史记录查询与筛选
- LLM 智能对话（多厂商支持 + 自动降级）
- 前端全部数据从 API 加载，mock 引用已清零

## 待完成

- 语音输入（前端 MicButton + 后端 Whisper 语音识别）
- 语法纠错（LLM 语法分析 + 纠错反馈）
- 发音评测（音频对比评分）
- 真实评分算法（替换随机数）
- 导出报告（PDF 生成）
- 单元测试 + 日志系统 + 数据库迁移