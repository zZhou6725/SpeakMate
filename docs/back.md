# 优化版：AI 英语口语陪练 - 后端开发文档

## 一、核心技术栈（本地开发版）

表格







|   模块   |             技术选型              |                           选型理由                           |
| :------: | :-------------------------------: | :----------------------------------------------------------: |
| Web 框架 |              FastAPI              | 异步高性能、自动生成 OpenAPI 文档、TypeHint 友好，适配实时语音对话低延迟需求 |
|  数据库  |      SQLite + SQLAlchemy 2.0      | 本地开发无需部署服务，SQLAlchemy 做 ORM，支持模型迁移和复杂查询 |
| LLM 对接 |        通义千问（Qwen）API        |     中文 / 英文对话能力强，适配场景化角色扮演、语法纠错      |
| 语音识别 |    OpenAI Whisper（本地部署）     |  离线 ASR，支持多语言，精准识别用户语音转文字，适配发音评测  |
| 数据验证 |            Pydantic v2            | 与 FastAPI 无缝集成，校验请求 / 响应数据，生成 TypeScript 类型 |
| 异步支持 |         AsyncIO + Uvicorn         |             处理实时语音对话的并发请求，降低延迟             |
| 依赖管理 |  Poetry / Pip + requirements.txt  |                 本地开发依赖隔离，简化包管理                 |
| 工具函数 | Python 标准库 + NumPy（评分计算） |      轻量无额外部署成本，满足发音 / 语法评分的数值计算       |

## 二、后端核心架构（本地版）

plaintext









```
backend/                   # 后端 FastAPI 项目
├── app/
│   ├── api/               # 接口层：按功能拆分路由，前端请求入口
│   │   ├── chat.py        # 场景对话接口（核心）：上下文管理、角色扮演
│   │   ├── speech.py      # 语音处理接口：ASR转写、TTS指令返回
│   │   ├── correction.py  # 语法纠错接口：接收文本返回纠错结果
│   │   ├── pronunciation.py # 发音评测接口：Whisper识别+评分计算
│   │   ├── report.py      # 课后总结接口：统计数据+生成报告
│   │   └── router.py      # 路由聚合：统一注册所有子路由
│   ├── agents/            # AI Agent 核心逻辑（业务层）
│   │   ├── conversation_agent.py  # 核心：多轮对话、场景/难度/角色控制
│   │   ├── correction_agent.py    # 语法纠错：调用LLM+格式化返回
│   │   ├── pronunciation_agent.py # 发音评测：Whisper+准确率计算
│   │   ├── analysis_agent.py      # 课后分析：统计+弱点分析
│   │   └── base_agent.py          # 基础Agent：封装LLM调用、通用逻辑
│   ├── models/            # SQLAlchemy ORM 模型（数据库层）
│   │   ├── base.py        # 模型基类：统一主键/创建时间
│   │   ├── practice_session.py # 练习会话：记录时长、场景、总分
│   │   ├── dialogue.py    # 对话记录：用户/AI内容、语音转写、时间戳
│   │   └── evaluation.py  # 评测记录：发音/语法分数、错误类型
│   ├── schemas/           # Pydantic 数据模型（接口校验）
│   │   ├── chat.py        # 对话请求/响应：场景、角色、消息、上下文
│   │   ├── speech.py      # 语音请求/响应：音频base64、转写文本
│   │   ├── correction.py  # 纠错请求/响应：原文、修正文、解释
│   │   ├── pronunciation.py # 发音评分：准确率、流利度、发音分
│   │   └── report.py      # 报告响应：总分、分项分、弱点
│   ├── services/          # 工具服务封装
│   │   ├── llm_service.py # LLM调用封装：Qwen API请求、Prompt组装
│   │   ├── asr_service.py # Whisper调用：语音转文字
│   │   └── db_service.py  # 数据库操作：会话/对话/评测的CRUD
│   ├── core/              # 核心配置
│   │   ├── config.py      # 本地配置：LLM密钥、Whisper模型、数据库路径
│   │   └── database.py    # 数据库连接：SQLite本地文件、会话创建
│   ├── utils/             # 工具函数
│   │   ├── score_calc.py  # 评分计算：准确率、流利度公式
│   │   └── prompt_builder.py # Prompt组装：场景/角色模板填充
│   └── main.py            # FastAPI启动入口：注册路由、中间件、数据库
├── requirements.txt       # 依赖清单（本地开发）
├── .env                   # 本地环境变量：LLM_API_KEY、DB_PATH
└── tests/                 # 本地单元测试（可选）
```

## 三、核心功能模块（后端实现细节）

### 1. 场景选择（基础）

- **核心逻辑**：读取`ai/scenarios/`下的 JSON 配置，返回场景列表给前端；接收前端场景选择，初始化对应角色 / 难度。

- **数据库**：`practice_session`表记录当前会话的场景（interview/restaurant/meeting）、难度（初级 / 中级 / 高级）。

- 接口示例

  ：

  python

  运行

  ```
# GET /api/scenarios （获取所有场景）
  # POST /api/session/init （初始化练习会话）
# 请求体：{"scenario": "interview", "difficulty": "Intermediate"}
  # 响应体：{"session_id": "local_123", "role": "HR Manager", "prompt": "You are an HR manager..."}
```

### 2. 实时语音对话（核心链路）

#### 前端→后端核心流程：

plaintext

```
用户语音 → 前端转base64 → POST /api/speech/recognize → 后端Whisper转文字 → 调用Conversation Agent → LLM生成回复 → 后端返回文字+TTS指令 → 前端语音合成播放
```

- **接口优化**：异步接口（`async def`）降低延迟，支持流式响应（可选，提升流畅性）。
- **上下文管理**：`conversation_agent.py`通过`session_id`维护对话上下文，存储在`dialogue`表。

### 3. 语法纠错

- **Agent 逻辑**：封装固定 Prompt（英文教师角色），接收用户文本，调用 LLM 后格式化 JSON 返回（原文 / 修正文 / 解释）。

- 接口示例

  ：

  python

  运行

  ```
# POST /api/correction
  # 请求体：{"text": "I very like this company.", "session_id": "local_123"}
# 响应体：{"original": "I very like this company.", "corrected": "I really like this company.", "explanation": "Use adverb 'really' before verb 'like'"}
  ```

- **数据库**：`evaluation`表记录每次纠错的错误类型（如 adverb usage），用于课后总结。

### 4. 发音评测（比赛重点）

- 核心计算逻辑

  ：

  python

  运行

  ```
  # 1. Whisper识别用户语音得到实际文本
  # 2. 与场景标准答案/参考文本对比
  # 3. 计算：
  # - Word Accuracy = 正确单词数 / 总单词数 * 100
  # - Fluency = 语音停顿次数/时长 反向计算
  # - Pronunciation = (Accuracy*0.6 + Fluency*0.4) 加权
  ```
  
- 接口示例

  ：

  python

  运行

  ```
  # POST /api/pronunciation/score
  # 请求体：{"audio_base64": "xxxx", "reference_text": "I want to order a steak", "session_id": "local_123"}
  # 响应体：{"pronunciation": 85, "fluency": 82, "accuracy": 88}
  ```

### 5. 课后总结

- Analysis Agent 逻辑

  ：

  1. 从`practice_session`获取总时长、总轮数；
  2. 从`evaluation`统计语法错误类型、发音平均分；
  3. 分析高频错误（如 verb tense/article usage）；
  4. 生成总分（加权：发音 0.5 + 语法 0.3 + 流畅度 0.2）。

- 接口示例

  ：

  python

  运行

  ```
# GET /api/report/{session_id}
  # 响应体：{"overall_score": 84, "grammar_score": 80, "pronunciation_score": 87, "weakness": ["verb tense", "article usage"]}
```

### 6. Conversation Agent（核心，易遗漏）

- 核心职责

  ：

  - 上下文记忆：通过`session_id`关联`dialogue`表，组装历史对话作为 LLM 的上下文；
  - 场景控制：严格按`ai/prompts/`下的场景 Prompt 生成回复，不偏离角色（如面试官不聊点餐）；
  - 难度控制：初级（简单词汇 / 短句）、中级（复杂句式）、高级（行业术语）；
  - 自然对话：避免 “用户一句→AI 一句” 的机械感，主动追问 / 引导（如面试官："Can you tell me about your work experience?" → 用户回答后 → "What was your biggest achievement in that role?"）。

## 四、数据库设计（SQLite 本地版）

### 1. practice_sessions（练习会话表）

表格

|    字段名     |    类型     |                  说明                  |
| :-----------: | :---------: | :------------------------------------: |
|      id       | TEXT (主键) |     会话 ID（本地生成：local_xxx）     |
|   scenario    |    TEXT     |      场景（interview/restaurant）      |
|  difficulty   |    TEXT     | 难度（Beginner/Intermediate/Advanced） |
|  start_time   |  DATETIME   |              会话开始时间              |
|   end_time    |  DATETIME   |              会话结束时间              |
| total_rounds  |   INTEGER   |               总对话轮数               |
| overall_score |    FLOAT    |           课后总分（0-100）            |
|  created_at   |  DATETIME   |              记录创建时间              |

### 2. dialogues（对话记录表）

表格

|       字段名        |        类型        |           说明            |
| :-----------------: | :----------------: | :-----------------------: |
|         id          | INTEGER (自增主键) |          对话 ID          |
|     session_id      |    TEXT (外键)     | 关联 practice_sessions.id |
|      user_text      |        TEXT        |    用户语音转写的文本     |
|       ai_text       |        TEXT        |        AI 回复文本        |
| pronunciation_score |       FLOAT        |        本轮发音分         |
| grammar_correction  |        JSON        |     本轮语法纠错结果      |
|      timestamp      |      DATETIME      |        对话时间戳         |

### 3. evaluations（评测记录表）

表格

|       字段名        |        类型        |              说明              |
| :-----------------: | :----------------: | :----------------------------: |
|         id          | INTEGER (自增主键) |            评测 ID             |
|     session_id      |    TEXT (外键)     |   关联 practice_sessions.id    |
|     error_type      |        TEXT        | 错误类型（verb tense/article） |
|     error_count     |      INTEGER       |       该类型错误出现次数       |
|    grammar_score    |       FLOAT        |           语法分项分           |
| pronunciation_score |       FLOAT        |           发音分项分           |

## 五、核心链路（端到端）

plaintext

```
1. 初始化会话
前端（场景选择）→ POST /api/session/init → 后端创建practice_session记录 → 返回session_id+角色Prompt

2. 实时语音对话
前端（用户语音→base64）→ POST /api/speech/recognize → 后端：
   a. Whisper转文字 → 存储到dialogues.user_text
   b. 调用Conversation Agent（传入session_id+历史上下文+场景/角色）
   c. LLM生成AI回复 → 存储到dialogues.ai_text
   d. 调用Pronunciation Agent → 计算发音分 → 存储到dialogues.pronunciation_score
   e. 调用Correction Agent → 语法纠错 → 存储到dialogues.grammar_correction
   f. 返回AI文本+发音分+纠错结果 → 前端播放语音+展示纠错

3. 课后总结
前端（结束会话）→ GET /api/report/{session_id} → 后端Analysis Agent：
   a. 统计practice_session+dialogues+evaluations数据
   b. 计算总分+高频错误 → 返回总结报告 → 前端展示
```





后端api

```
 ---                                                                                                                             
  1. 场景管理

  GET /api/scenarios — 获取所有练习场景

  Response:
  [
    { "id": 1, "name": "面试", "difficulty": "中等" },
    { "id": 2, "name": "餐厅", "difficulty": "简单" },
    { "id": 3, "name": "会议", "difficulty": "困难" },
    { "id": 4, "name": "旅行", "difficulty": "简单" }
  ]

  ---
  2. 仪表盘

  GET /api/dashboard/stats — 获取用户练习统计数据

  Response:
  {
    "totalPractice": 28,
    "averageScore": 84,
    "bestScore": 92
  }

  ---
  3. 历史记录

  GET /api/history?scenario={场景名}&timeRange={本周|本月|全部} — 获取历史练习列表（筛选参数可选）

  Response:
  [
    {
      "id": 1,
      "date": "2026-06-05",
      "scenario": "面试",
      "score": 85,
      "duration": "11分钟",
      "grammar": 82,
      "pronunciation": 87
    }
  ]

  GET /api/history/filters — 获取筛选器选项

  Response:
  {
    "scenarios": ["全部", "面试", "餐厅", "会议", "旅行"],
    "timeRanges": ["本周", "本月", "全部"]
  }

  ---
  4. 练习会话（核心流程）

  POST /api/sessions — 创建新会话，返回初始 AI 对话

  Request:
  { "scenarioId": 1 }

  Response:
  {
    "id": 5,
    "scenarioId": 1,
    "scenarioName": "面试",
    "conversation": [
      { "role": "ai", "message": "请简单介绍一下你自己。" }
    ],
    "feedback": { "grammar": 0, "pronunciation": 0, "fluency": 0 },
    "radarData": { "pronunciation": 0, "grammar": 0, "vocabulary": 0, "fluency": 0, "confidence": 0 },
    "score": 0,
    "duration": "0分钟"
  }

  POST /api/sessions/{id}/messages — 发送用户消息，返回 AI 回复 + 实时反馈

  Request:
  { "message": "我是一名软件工程专业的学生。" }

  Response:
  {
    "userMessage": { "role": "user", "message": "我是一名软件工程专业的学生。" },
    "aiMessage": { "role": "ai", "message": "你为什么选择了这个专业？" },
    "feedback": { "grammar": 82, "pronunciation": 87, "fluency": 85 }
  }

  ▎ 注: feedback 可以是增量更新，也可以每次都返回当前累计评分。

  POST /api/sessions/{id}/end — 结束会话，返回最终报告数据

  Response:
  {
    "id": 5,
    "scenarioId": 1,
    "scenarioName": "面试",
    "conversation": [ /* 完整对话 */ ],
    "feedback": { "grammar": 82, "pronunciation": 87, "fluency": 85 },
    "radarData": { "pronunciation": 87, "grammar": 82, "vocabulary": 84, "fluency": 85, "confidence": 83 },
    "score": 85,
    "duration": "11分钟"
  }

  ---
  5. 练习报告

  GET /api/reports/{id} — 获取历史报告详情

  Response: 同 PracticeSession 结构（见上方结束会话的响应）

  GET /api/reports/{id}/export — 导出报告（预留，可后续实现）

  ---
  类型定义汇总
┌─────────────────┬─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
  │      类型       │                                                        字段                                                         │
  ├─────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ Scenario        │ id: number, name: string, difficulty: '简单' | '中等' | '困难'                                                      │
  ├─────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ChatMessage     │ role: 'ai' | 'user', message: string                                                                                │
  ├─────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ FeedbackData    │ grammar: number, pronunciation: number, fluency: number                                                             │
  ├─────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ RadarData       │ pronunciation: number, grammar: number, vocabulary: number, fluency: number, confidence: number                     │
  ├─────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ DashboardStats  │ totalPractice: number, averageScore: number, bestScore: number                                                      │
  ├─────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ HistoryEntry    │ id: number, date: string, scenario: string, score: number, duration: string, grammar: number, pronunciation: number │
  ├─────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ PracticeSession │ 继承以上，包含 scenarioId, scenarioName, conversation[], feedback, radarData, score, duration                       │
  └─────────────────┴─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘



  ---
  接口总览

  ┌──────┬───────────────────────────────────┬──────────────────────┐
  │ 方法 │               路径                │         说明         │
  ├──────┼───────────────────────────────────┼──────────────────────┤
  │ GET  │ /api/scenarios                    │ 场景列表             │
  ├──────┼───────────────────────────────────┼──────────────────────┤
  │ GET  │ /api/dashboard/stats              │ 仪表盘统计           │
  ├──────┼───────────────────────────────────┼──────────────────────┤
  │ GET  │ /api/history?scenario=&timeRange= │ 历史记录（支持筛选） │
  ├──────┼───────────────────────────────────┼──────────────────────┤
  │ GET  │ /api/history/filters              │ 筛选器选项           │
  ├──────┼───────────────────────────────────┼──────────────────────┤
  │ POST │ /api/sessions                     │ 创建练习会话         │
  ├──────┼───────────────────────────────────┼──────────────────────┤
  │ POST │ /api/sessions/{id}/messages       │ 发送对话消息         │
  ├──────┼───────────────────────────────────┼──────────────────────┤
  │ POST │ /api/sessions/{id}/end            │ 结束会话             │
  ├──────┼───────────────────────────────────┼──────────────────────┤
  │ GET  │ /api/reports/{id}                 │ 报告详情             │
  ├──────┼───────────────────────────────────┼──────────────────────┤
  │ GET  │ /api/reports/{id}/export          │ 导出报告（预留）     │
  └──────┴───────────────────────────────────┴──────────────────────┘

  共 9 个接口，覆盖了场景选择 → 练习对话 → 实时反馈 → 历史记录 → 报告查看的完整流程。类型定义文件在
  frontend/src/types/index.ts，可以直接作为前后端的数据契约参考。
```

